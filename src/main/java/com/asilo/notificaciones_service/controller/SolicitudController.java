package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.dto.AgendarCitaDTO;
import com.asilo.notificaciones_service.dto.NotificacionDTO;
import com.asilo.notificaciones_service.dto.SolicitudDTO;
import com.asilo.notificaciones_service.model.Solicitud;
import com.asilo.notificaciones_service.repository.SolicitudRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate; // Importación necesaria para asignar la fecha actual
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/solicitudes")
@CrossOrigin(origins = "*") // Permite la conexión con app.js
public class SolicitudController {

    @Autowired
    private SolicitudRepository solicitudRepository;

    // 1. Obtener todas las solicitudes registradas (usado por el Médico General y la Fundación)
    @GetMapping
    public List<Solicitud> obtenerTodasLasSolicitudes() {
        return solicitudRepository.findAll();
    }

    // 2. Crear solicitud de remisión realizada por el Médico General
    @PostMapping
    public ResponseEntity<?> crearSolicitud(@RequestBody SolicitudDTO dto) {
        
        // Guardar la solicitud de remisión en la BD SQL Server
        Solicitud entidad = new Solicitud();
        
        // Conversiones explícitas de Long a Integer para evitar errores de compilación
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
        
        // --- ASIGNACIÓN AUTOMÁTICA DE LA FECHA DE SOLICITUD ---
        entidad.setFechaSolicitud(LocalDate.now());

        Solicitud guardada = solicitudRepository.save(entidad);

        // Disparar la notificación al microservicio externo (puerto 8082)
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

    // 3. Agendar cita asignando Médico Especialista, Fecha y Hora desde la Fundación
    @PutMapping("/{id}/agendar")
    public ResponseEntity<?> agendarCita(@PathVariable Long id, @RequestBody AgendarCitaDTO dto) {
        
        Optional<Solicitud> optSolicitud = solicitudRepository.findById(id);
        if (optSolicitud.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("La solicitud no existe.");
        }

        // VALIDACIÓN DE TRASLAPE DE HORARIO:
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

        // Asignar médico, fecha, hora y cambiar estado
        Solicitud solicitud = optSolicitud.get();
        if (dto.getIdMedicoEspecialista() != null) {
            solicitud.setIdMedicoEspecialista(dto.getIdMedicoEspecialista().intValue());
        }
        solicitud.setFechaCita(dto.getFechaCita());
        solicitud.setHoraCita(dto.getHoraCita());
        solicitud.setEstado("AGENDADA");

        Solicitud actualizada = solicitudRepository.save(solicitud);
        return ResponseEntity.ok(actualizada);
    }
}