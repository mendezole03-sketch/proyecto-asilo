package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.model.AgendaEnfermeria;
import com.asilo.notificaciones_service.repository.AgendaEnfermeriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enfermeria")
@CrossOrigin(origins = "*")
public class EnfermeriaController {

    @Autowired
    private AgendaEnfermeriaRepository agendaEnfermeriaRepository;

    // Endpoint que conecta con app-enfermeria.js para traer los turnos reales
    @GetMapping("/agenda/{idEnfermero}")
    public ResponseEntity<List<AgendaEnfermeria>> obtenerAgendaEnfermero(@PathVariable Long idEnfermero) {
        List<AgendaEnfermeria> agenda = agendaEnfermeriaRepository.findByIdEnfermero(idEnfermero);
        return ResponseEntity.ok(agenda);
    }
}