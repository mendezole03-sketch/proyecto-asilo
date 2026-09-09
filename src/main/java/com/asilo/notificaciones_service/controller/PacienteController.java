package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.model.Paciente;
import com.asilo.notificaciones_service.repository.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pacientes")
@CrossOrigin(origins = "*") // Permite peticiones desde el Frontend
public class PacienteController {

    @Autowired
    private PacienteRepository pacienteRepository;

    @GetMapping
    public List<Paciente> listarPacientes() {
        return pacienteRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Paciente> guardarPaciente(@RequestBody Paciente paciente) {
        Paciente nuevoPaciente = pacienteRepository.save(paciente);
        return ResponseEntity.ok(nuevoPaciente);
    }
}