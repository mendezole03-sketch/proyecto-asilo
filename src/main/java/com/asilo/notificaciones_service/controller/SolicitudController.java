package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.dto.AgendarCitaDTO;
import com.asilo.notificaciones_service.dto.NotificacionDTO;
import com.asilo.notificaciones_service.dto.SolicitudDTO;
import com.asilo.notificaciones_service.model.AgendaEnfermeria;
import com.asilo.notificaciones_service.model.Solicitud;
import com.asilo.notificaciones_service.repository.AgendaEnfermeriaRepository;
import com.asilo.notificaciones_service.repository.PacienteRepository;
import com.asilo.notificaciones_service.repository.SolicitudRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/solicitudes")
@CrossOrigin(origins = "*")
public class SolicitudController {

    @Autowired
    private SolicitudRepository solicitudRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private AgendaEnfermeriaRepository agendaEnfermeriaRepository;

    // 1. Obtener todas las solicitudes registradas (Soft Delete)
    @GetMapping
    public List<Solicitud> obtenerTodasLasSolicitudes() {
        List<Solicitud> solicitudes = solicitudRepository.findAll();

        for (Solicitud sol : solicitudes) {
            if (sol.getIdPaciente() != null) {
                pacienteRepository.findById(sol.getIdPaciente()).ifPresentOrElse(
                    paciente -> sol.setPacienteActivo(paciente.getActivo()),
                    () -> sol.setPacienteActivo(false)
                );
            }
        }

        return solicitudes;
    }

    // 2. Crear solicitud de remisión (Médico General) -> AQUÍ NACE COMO PENDIENTE
    @PostMapping
    public ResponseEntity<?> crearSolicitud(@RequestBody SolicitudDTO dto) {
        Solicitud entidad = new Solicitud();
        
        if (dto.getIdPaciente() != null) {
            entidad.setIdPaciente(dto.getIdPaciente().intValue());
        }
        
        entidad.setNombrePaciente(dto.getNombrePaciente());
        entidad.setNombreFamiliar(dto.getNombreFamiliar());
        entidad.setCorreoFamiliar(dto.getCorreoFamiliar());
        entidad.setMedicoEspecialista(dto.getMedicoEspecialista());
        
        if (dto.getIdMedicoEspecialista() != null) {
            entidad.setIdMedicoEspecialista(dto.getIdMedicoEspecialista().intValue());
        }
        
        if (dto.getIdEnfermero() != null) {
            entidad.setIdEnfermero(dto.getIdEnfermero().intValue());
        }

        entidad.setMotivo(dto.getMotivo());
        entidad.setHorarioEnfermero(null); 
        entidad.setEstado("PENDIENTE");
        entidad.setFechaSolicitud(LocalDate.now());

        Solicitud guardada = solicitudRepository.save(entidad);

        // --- CREAR REGISTRO INICIAL EN LA AGENDA DE ENFERMERÍA (PENDIENTE) ---
        if (guardada.getIdEnfermero() != null) {
            AgendaEnfermeria agenda = new AgendaEnfermeria();
            agenda.setIdEnfermero(Long.valueOf(guardada.getIdEnfermero()));
            agenda.setIdSolicitud(guardada.getIdSolicitud());
            agenda.setNombrePaciente(guardada.getNombrePaciente() != null ? guardada.getNombrePaciente() : "Paciente");
            agenda.setTurnoAsignado("Por definir");
            agenda.setEstado("Pendiente");

            agendaEnfermeriaRepository.save(agenda);
        }
        // -------------------------------------------------------------------

        try {
            RestTemplate restTemplate = new RestTemplate();
            // AHORA:
            String url = "https://notificaciones-cabeza-algodon-d8dza9agf0eeh5au.centralus-01.azurewebsites.net/api/v1/notificaciones/solicitud";

            NotificacionDTO datosCorreo = new NotificacionDTO(
                guardada.getIdSolicitud(),
                guardada.getNombrePaciente(),
                guardada.getNombreFamiliar(),
                guardada.getCorreoFamiliar(),
                guardada.getMedicoEspecialista(),
                guardada.getMotivo()
            );

            String respuesta = restTemplate.postForObject(url, datosCorreo, String.class);
            System.out.println(">>> Notificación externa procesada: " + respuesta);
            
        } catch (Exception e) {
            System.err.println(">>> Error al llamar a notificaciones-service: " + e.getMessage());
        }

        return ResponseEntity.ok(guardada);
    }

    // 3. Agendar cita asignando Fecha, Hora y Turno de Enfermero (Fundación) -> AQUÍ SE ACTUALIZA A PROGRAMADO
    @PutMapping("/{id}/agendar")
    public ResponseEntity<?> agendarCita(@PathVariable Long id, @RequestBody AgendarCitaDTO dto) {
        
        Optional<Solicitud> optSolicitud = solicitudRepository.findById(id);
        if (optSolicitud.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("La solicitud no existe.");
        }

        Solicitud solicitud = optSolicitud.get();

        // A. VALIDACIÓN: Médico Especialista Ocupado (SOLO si tiene cita AGENDADA activa)
        List<Solicitud> citasExistentes = solicitudRepository.findAll();
        boolean medicoOcupado = citasExistentes.stream().anyMatch(s -> 
            !s.getIdSolicitud().equals(id) && 
            s.getIdMedicoEspecialista() != null &&
            dto.getIdMedicoEspecialista() != null &&
            s.getIdMedicoEspecialista().longValue() == dto.getIdMedicoEspecialista().longValue() &&
            s.getFechaCita() != null &&
            s.getFechaCita().equals(dto.getFechaCita()) &&
            s.getHoraCita() != null &&
            s.getHoraCita().equalsIgnoreCase(dto.getHoraCita().trim()) &&
            "AGENDADA".equalsIgnoreCase(s.getEstado()) // <-- CLAVE: Solo evalúa citas con estado AGENDADA
        );

        if (medicoOcupado) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("El médico especialista seleccionado ya tiene una cita agendada para esa fecha y hora.");
        }

        // B. VALIDACIÓN: Enfermero Ocupado (Solo si tiene cita AGENDADA activa)
        Integer idEnfermero = solicitud.getIdEnfermero();
        if (idEnfermero != null && dto.getFechaCita() != null && dto.getHorarioEnfermero() != null) {
            boolean enfermeroOcupado = solicitudRepository.existsByIdEnfermeroAndFechaCitaAndHorarioEnfermeroAndEstado(
                idEnfermero,
                dto.getFechaCita(),
                dto.getHorarioEnfermero(),
                "AGENDADA"
            );

            if (enfermeroOcupado) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("El enfermero ya se encuentra asignado a otra cita activa en esa misma fecha y turno (" + dto.getHorarioEnfermero() + ").");
            }
        }

        // C. Actualizar y Guardar Datos
        if (dto.getIdMedicoEspecialista() != null) {
            solicitud.setIdMedicoEspecialista(dto.getIdMedicoEspecialista().intValue());
        }
        solicitud.setFechaCita(dto.getFechaCita());
        solicitud.setHoraCita(dto.getHoraCita());
        if (dto.getHorarioEnfermero() != null) {
            solicitud.setHorarioEnfermero(dto.getHorarioEnfermero());
        }
        solicitud.setEstado("AGENDADA");

        Solicitud actualizada = solicitudRepository.save(solicitud);

        // --- D. ACTUALIZAR EL REGISTRO EXISTENTE EN LA AGENDA DE ENFERMERÍA ---
        if (actualizada.getIdEnfermero() != null) {
            agendaEnfermeriaRepository.findByIdSolicitud(actualizada.getIdSolicitud()).ifPresentOrElse(
                agendaExistente -> {
                    // Si ya existe (creado por el médico general), actualizamos el turno y pasamos a Programado
                    agendaExistente.setTurnoAsignado(actualizada.getHorarioEnfermero() != null ? actualizada.getHorarioEnfermero() : "Turno General");
                    agendaExistente.setEstado("Programado");
                    agendaEnfermeriaRepository.save(agendaExistente);
                },
                () -> {
                    // Por seguridad, si no existiera previamente, lo creamos de emergencia
                    AgendaEnfermeria agenda = new AgendaEnfermeria();
                    agenda.setIdEnfermero(Long.valueOf(actualizada.getIdEnfermero()));
                    agenda.setIdSolicitud(actualizada.getIdSolicitud());
                    agenda.setNombrePaciente(actualizada.getNombrePaciente() != null ? actualizada.getNombrePaciente() : "Paciente");
                    agenda.setTurnoAsignado(actualizada.getHorarioEnfermero() != null ? actualizada.getHorarioEnfermero() : "Turno General");
                    agenda.setEstado("Programado");
                    agendaEnfermeriaRepository.save(agenda);
                }
            );
        }
        // ---------------------------------------------------------------------

        try {
            RestTemplate restTemplate = new RestTemplate();
           
            // AHORA:
            String url = "https://notificaciones-cabeza-algodon-d8dza9agf0eeh5au.centralus-01.azurewebsites.net/api/v1/notificaciones/agendar";
            

            String detalleAgendamiento = String.format("%s (Programada para el %s a las %s)", 
                    actualizada.getMotivo(), 
                    actualizada.getFechaCita(), 
                    actualizada.getHoraCita());

            NotificacionDTO datosCorreo = new NotificacionDTO(
                actualizada.getIdSolicitud(),
                actualizada.getNombrePaciente(),
                actualizada.getNombreFamiliar(),
                actualizada.getCorreoFamiliar(),
                actualizada.getMedicoEspecialista(),
                detalleAgendamiento
            );

            String respuesta = restTemplate.postForObject(url, datosCorreo, String.class);
            System.out.println(">>> Notificación de agendamiento procesada: " + respuesta);
            
        } catch (Exception e) {
            System.err.println(">>> Error al llamar a notificaciones-service al agendar: " + e.getMessage());
        }

        return ResponseEntity.ok(actualizada);
    }

    // 4. Cancelar cita / solicitud
    @PutMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelarSolicitud(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Optional<Solicitud> optSolicitud = solicitudRepository.findById(id);
        if (optSolicitud.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("La solicitud no existe.");
        }

        Solicitud solicitud = optSolicitud.get();
        solicitud.setEstado("CANCELADA");
        
        if (payload != null && payload.containsKey("motivoCancelacion")) {
            solicitud.setMotivoCancelacion(payload.get("motivoCancelacion"));
        }

        Solicitud actualizada = solicitudRepository.save(solicitud);
        return ResponseEntity.ok(actualizada);
    }

    // 5. Marcar cita como completada / realizada
    @PutMapping("/{id}/completar")
    public ResponseEntity<?> completarSolicitud(@PathVariable Long id) {
        Optional<Solicitud> optSolicitud = solicitudRepository.findById(id);
        if (optSolicitud.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("La solicitud no existe.");
        }

        Solicitud solicitud = optSolicitud.get();
        solicitud.setEstado("COMPLETADA");
        Solicitud actualizada = solicitudRepository.save(solicitud);

        return ResponseEntity.ok(actualizada);
    }
}