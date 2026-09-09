package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.model.Familiar;
import com.asilo.notificaciones_service.model.Paciente;
import com.asilo.notificaciones_service.repository.FamiliarRepository;
import com.asilo.notificaciones_service.repository.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/pacientes")
@CrossOrigin(origins = "*")
public class PacienteController {

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private FamiliarRepository familiarRepository;

    @GetMapping
    public List<Paciente> obtenerTodos() {
        return pacienteRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Paciente> guardarPaciente(@RequestBody Paciente paciente) {
        if (paciente.getFamiliar() != null) {
            String nombreFamiliar = paciente.getFamiliar().getNombre();

            // Busca si ya existe el familiar por su nombre
            Optional<Familiar> familiarExistente = familiarRepository.findByNombreIgnoreCase(nombreFamiliar);

            if (familiarExistente.isPresent()) {
                // Si ya existe, reusa el familiar encontrado
                paciente.setFamiliar(familiarExistente.get());
            } else {
                // Si no existe, guarda al nuevo familiar primero
                Familiar nuevoFamiliar = familiarRepository.save(paciente.getFamiliar());
                paciente.setFamiliar(nuevoFamiliar);
            }
        }

        Paciente pacienteGuardado = pacienteRepository.save(paciente);
        return ResponseEntity.ok(pacienteGuardado);
    }
}