package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.dto.NotificacionDTO;
import com.asilo.notificaciones_service.dto.SolicitudDTO;
import com.asilo.notificaciones_service.model.Solicitud;
import com.asilo.notificaciones_service.repository.SolicitudRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/solicitudes")
@CrossOrigin(origins = "*") // Permite la conexión con app.js
public class SolicitudController {

    @Autowired
    private SolicitudRepository solicitudRepository;

    @PostMapping
    public ResponseEntity<?> crearSolicitud(@RequestBody SolicitudDTO dto) {
        
        // 1. Guardar la solicitud de remisión en la BD SQL Server
        Solicitud entidad = new Solicitud();
        entidad.setIdPaciente(dto.getIdPaciente());
        entidad.setNombrePaciente(dto.getNombrePaciente());
        entidad.setNombreFamiliar(dto.getNombreFamiliar());
        entidad.setCorreoFamiliar(dto.getCorreoFamiliar());
        entidad.setMedicoEspecialista(dto.getMedicoEspecialista());
        entidad.setIdMedicoEspecialista(dto.getIdMedicoEspecialista()); // Permite NULL
        entidad.setIdEnfermero(dto.getIdEnfermero());
        entidad.setMotivo(dto.getMotivo());

        Solicitud guardada = solicitudRepository.save(entidad);

        // 2. Disparar la notificación al microservicio externo (puerto 8082)
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "http://localhost:8082/api/v1/notificaciones/solicitud";

            // Convertimos los datos al NotificacionDTO que espera el microservicio de correo
            NotificacionDTO datosCorreo = new NotificacionDTO(
                guardada.getIdSolicitud(), // Usa el ID generado por la BD
                guardada.getNombrePaciente(),
                guardada.getNombreFamiliar(),
                guardada.getCorreoFamiliar(),
                guardada.getMedicoEspecialista(),
                guardada.getMotivo()
            );

            // Enviamos los datos vía HTTP POST
            String respuesta = restTemplate.postForObject(url, datosCorreo, String.class);
            System.out.println(">>> Notificación externa procesada: " + respuesta);
            
        } catch (Exception e) {
            // Evita que la app falle si el servicio de correo tiene problemas
            System.err.println(">>> Error al llamar a notificaciones-service: " + e.getMessage());
        }

        return ResponseEntity.ok(guardada);
    }
}