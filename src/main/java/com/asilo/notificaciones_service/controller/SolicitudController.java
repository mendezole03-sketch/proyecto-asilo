package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.dto.NotificacionDTO;
import com.asilo.notificaciones_service.dto.SolicitudDTO;
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
    
    @PostMapping
    public ResponseEntity<?> crearSolicitud(@RequestBody SolicitudDTO solicitud) {
        // 1. Aquí va tu Lógica para guardar la solicitud de remisión en la BD
        
        // 2. Disparar la notificación al microservicio externo (puerto 8082)[cite: 2, 5]
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "http://localhost:8082/api/v1/notificaciones/solicitud";

            // Convertimos la SolicitudDTO recibida al NotificacionDTO que espera el otro microservicio[cite: 2, 4]
            NotificacionDTO datosCorreo = new NotificacionDTO(
                solicitud.getIdSolicitud(),
                solicitud.getNombrePaciente(),
                solicitud.getNombreFamiliar(),
                solicitud.getCorreoFamiliar(),
                solicitud.getMedicoEspecialista(),
                solicitud.getMotivo()
            );

            // Enviamos los datos vía HTTP POST
            String respuesta = restTemplate.postForObject(url, datosCorreo, String.class);
            System.out.println(">>> Notificación externa procesada: " + respuesta);
            
        } catch (Exception e) {
            // Se captura cualquier fallo de red para evitar que la app falle si el servicio de correo está apagado
            System.err.println(">>> Error al llamar a notificaciones-service: " + e.getMessage());
        }

        return ResponseEntity.ok().build();
    }
}