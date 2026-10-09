package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.model.Donacion;
import com.asilo.notificaciones_service.repository.DonacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/donaciones")
@CrossOrigin(origins = "*")
public class DonacionController {

    @Autowired
    private DonacionRepository donacionRepository;

    // GET /api/donaciones -> Lista el historial para la tabla de la derecha
    @GetMapping
    public ResponseEntity<List<Donacion>> listarDonaciones() {
        List<Donacion> lista = donacionRepository.findAll();
        return ResponseEntity.ok(lista);
    }

    // POST /api/donaciones -> Registra una nueva donación desde el formulario
    @PostMapping
    @Transactional
    public ResponseEntity<?> registrarDonacion(@RequestBody Donacion donacion) {
        try {
            Donacion guardada = donacionRepository.save(donacion);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al registrar la donación: " + e.getMessage()));
        }
    }
}