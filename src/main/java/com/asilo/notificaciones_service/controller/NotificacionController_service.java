/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.asilo.notificaciones_service.controller;



import com.asilo.notificaciones_service.dto.NotificacionDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notificaciones")
public class NotificacionController_service {

    @Autowired
    private JavaMailSender mailSender;

    @PostMapping("/solicitud")
    public ResponseEntity<String> enviarNotificacion(@RequestBody NotificacionDTO datos) {
        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setTo(datos.getCorreoFamiliar());
            mensaje.setSubject("Atención Médica - Asilo Cabeza de Algodón: " + datos.getNombrePaciente());
            
            String contenido = String.format(
                "Estimado/a %s,\n\n" +
                "Le informamos que se ha generado una solicitud médica para su familiar en el Asilo Cabeza de Algodón.\n\n" +
                "Detalles de la atención:\n" +
                "- No. Solicitud: %d\n" +
                "- Paciente: %s\n" +
                "- Referido a: %s\n" +
                "- Motivo: %s\n\n" +
                "Atentamente,\nAdministración Asilo Cabeza de Algodón.",
                datos.getNombreFamiliar(),
                datos.getIdSolicitud(),
                datos.getNombrePaciente(),
                datos.getMedicoEspecialista(),
                datos.getMotivo()
            );

            mensaje.setText(contenido);
            mailSender.send(mensaje);

            return ResponseEntity.ok("Notificación enviada exitosamente a " + datos.getCorreoFamiliar());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al enviar el correo: " + e.getMessage());
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Microservicio de Notificaciones activo.");
    }
}