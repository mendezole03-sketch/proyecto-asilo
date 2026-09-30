package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.dto.AgendarCitaDTO;
import com.asilo.notificaciones_service.dto.NotificacionDTO;
import com.asilo.notificaciones_service.dto.SolicitudDTO;
import com.asilo.notificaciones_service.model.Solicitud;
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
    private PacienteRepository pacienteRepository; // Inyección agregada para verificar el estado del paciente

    // 1. Obtener todas las solicitudes registradas (ACTUALIZADO para Soft Delete)
    @GetMapping
    public List<Solicitud> obtenerTodasLasSolicitudes() {
        List<Solicitud> solicitudes = solicitudRepository.findAll();

        // Rellenar la bandera 'pacienteActivo' consultando el estado real en la BD
        for (Solicitud sol : solicitudes) {
            if (sol.getIdPaciente() != null) {
                pacienteRepository.findById(sol.getIdPaciente()).ifPresentOrElse(
                    paciente -> sol.setPacienteActivo(paciente.getActivo()),
                    () -> sol.setPacienteActivo(false) // Si el paciente ya no existe, se marca inactivo
                );
            }
        }

        return solicitudes;
    }

    // 2. Crear solicitud de remisión (Médico General)
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
        entidad.setEstado("PENDIENTE");
        entidad.setFechaSolicitud(LocalDate.now());

        Solicitud guardada = solicitudRepository.save(entidad);

        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "http://localhost:8082/api/v1/notificaciones/solicitud";

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

    // 3. Agendar cita asignando Fecha y Hora (Fundación)
    @PutMapping("/{id}/agendar")
    public ResponseEntity<?> agendarCita(@PathVariable Long id, @RequestBody AgendarCitaDTO dto) {
        
        Optional<Solicitud> optSolicitud = solicitudRepository.findById(id);
        if (optSolicitud.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("La solicitud no existe.");
        }

        List<Solicitud> citasExistentes = solicitudRepository.findAll();
        boolean medicoOcupado = citasExistentes.stream().anyMatch(s -> 
            s.getIdMedicoEspecialista() != null &&
            dto.getIdMedicoEspecialista() != null &&
            s.getIdMedicoEspecialista().longValue() == dto.getIdMedicoEspecialista().longValue() &&
            s.getFechaCita() != null &&
            s.getFechaCita().equals(dto.getFechaCita()) &&
            s.getHoraCita() != null &&
            s.getHoraCita().equalsIgnoreCase(dto.getHoraCita().trim()) &&
            !"CANCELADA".equalsIgnoreCase(s.getEstado())
        );

        if (medicoOcupado) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("El médico especialista seleccionado ya tiene una cita agendada para esa fecha y hora.");
        }

        Solicitud solicitud = optSolicitud.get();
        if (dto.getIdMedicoEspecialista() != null) {
            solicitud.setIdMedicoEspecialista(dto.getIdMedicoEspecialista().intValue());
        }
        solicitud.setFechaCita(dto.getFechaCita());
        solicitud.setHoraCita(dto.getHoraCita());
        solicitud.setEstado("AGENDADA");

        Solicitud actualizada = solicitudRepository.save(solicitud);

        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "http://localhost:8082/api/v1/notificaciones/agendar";

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

    // 4. Cancelar cita / solicitud (recibe el motivoCancelacion)
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