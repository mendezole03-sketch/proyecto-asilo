/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.dto.SolicitudDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/solicitudes")
@CrossOrigin(origins = "*") // <-- IMPORTANTE: Permite la conexión con app.js
public class SolicitudController {
    
    @PostMapping
    public ResponseEntity<?> crearSolicitud(@RequestBody SolicitudDTO solicitud) {
        // Lógica para guardar la solicitud de remisión
        return ResponseEntity.ok().build();
    }
}