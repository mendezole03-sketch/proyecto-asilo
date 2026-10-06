package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.model.RecetaMedicamento;
import com.asilo.notificaciones_service.repository.FarmaciaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/farmacia")
@CrossOrigin(origins = "*")
public class FarmaciaController {

    @Autowired
    private FarmaciaRepository farmaciaRepository;

    @GetMapping
    public ResponseEntity<?> obtenerTodasLasRecetas() {
        try {
            List<RecetaMedicamento> lista = farmaciaRepository.findAll();
            return ResponseEntity.ok(lista);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al obtener recetas: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> despacharMedicamento(@PathVariable("id") Long id, @RequestBody RecetaMedicamento datos) {
        try {
            Optional<RecetaMedicamento> optReceta = farmaciaRepository.findById(id);
            if (optReceta.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Receta no encontrada."));
            }

            RecetaMedicamento recetaExistente = optReceta.get();
            if (datos.getCostoMedicamento() != null) {
                recetaExistente.setCostoMedicamento(datos.getCostoMedicamento());
            }
            recetaExistente.setEstado("ENTREGADO");

            RecetaMedicamento guardado = farmaciaRepository.save(recetaExistente);
            return ResponseEntity.ok(guardado);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al despachar medicamento: " + e.getMessage()));
        }
    }
}