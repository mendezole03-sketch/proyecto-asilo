package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.model.Gasto;
import com.asilo.notificaciones_service.repository.GastoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gastos")
@CrossOrigin(origins = "*")
public class GastoController {

    @Autowired
    private GastoRepository gastoRepository;

    // GET /api/gastos -> Lista el historial para la tabla de fiscalización de la derecha
    @GetMapping
    public ResponseEntity<List<Gasto>> listarGastos() {
        List<Gasto> lista = gastoRepository.findAll();
        return ResponseEntity.ok(lista);
    }

    // POST /api/gastos -> Registra un nuevo gasto u egreso operativo
    @PostMapping
    @Transactional
    public ResponseEntity<?> registrarGasto(@RequestBody Gasto gasto) {
        try {
            Gasto guardado = gastoRepository.save(gasto);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al registrar el gasto: " + e.getMessage()));
        }
    }
}