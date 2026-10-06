package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.model.ExamenLaboratorio;
import com.asilo.notificaciones_service.repository.ExamenLaboratorioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/examenes")
@CrossOrigin(origins = "*")
public class LaboratorioController {

    @Autowired
    private ExamenLaboratorioRepository examenRepository;

    /**
     * GET /api/examenes
     * Obtiene la lista real de la base de datos
     */
    @GetMapping
    public ResponseEntity<?> obtenerTodosLosExamenes() {
        try {
            List<ExamenLaboratorio> lista = examenRepository.findAll();
            return ResponseEntity.ok(lista);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al obtener exámenes: " + e.getMessage()));
        }
    }

    /**
     * GET /api/examenes/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerExamenPorId(@PathVariable("id") Long id) {
        Optional<ExamenLaboratorio> examen = examenRepository.findById(id);
        if (examen.isPresent()) {
            return ResponseEntity.ok(examen.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Examen no encontrado con ID: " + id));
        }
    }

    /**
     * PUT /api/examenes/{id}
     * Guarda el resultado, costo y cambia estado a REALIZADO
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarExamen(@PathVariable("id") Long id, @RequestBody ExamenLaboratorio datosActualizados) {
        try {
            Optional<ExamenLaboratorio> optExamen = examenRepository.findById(id);
            if (optExamen.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Examen no encontrado para actualizar."));
            }

            ExamenLaboratorio examenExistente = optExamen.get();
            
            if (datosActualizados.getCostoExamen() != null) {
                examenExistente.setCostoExamen(datosActualizados.getCostoExamen());
            }
            if (datosActualizados.getResultado() != null) {
                examenExistente.setResultado(datosActualizados.getResultado());
            }
            examenExistente.setEstado("REALIZADO");

            ExamenLaboratorio guardado = examenRepository.save(examenExistente);
            return ResponseEntity.ok(guardado);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al guardar resultado: " + e.getMessage()));
        }
    }
}