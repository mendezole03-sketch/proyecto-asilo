package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.model.CuotaMensual;
import com.asilo.notificaciones_service.repository.CuotaMensualRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cuotas")
@CrossOrigin(origins = "*")
public class CuotaMensualController {

    @Autowired
    private CuotaMensualRepository cuotaMensualRepository;

    // GET /api/cuotas -> Lista todas las cuotas mensuales (pendientes y pagadas)
    @GetMapping
    public ResponseEntity<List<CuotaMensual>> listarCuotas() {
        List<CuotaMensual> lista = cuotaMensualRepository.findAll();
        return ResponseEntity.ok(lista);
    }

    // POST /api/cuotas -> Registra una nueva cuota mensual desde el formulario web
    @PostMapping
    @Transactional
    public ResponseEntity<?> registrarCuota(@RequestBody CuotaMensual cuota) {
        try {
            // Aseguramos que el estado inicial sea Pendiente si viene vacío
            if (cuota.getEstado() == null || cuota.getEstado().isEmpty()) {
                cuota.setEstado("Pendiente");
            }
            CuotaMensual guardada = cuotaMensualRepository.save(cuota);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al registrar la cuota: " + e.getMessage()));
        }
    }

    // PUT /api/cuotas/{id}/pagar -> Cambia el estado de la cuota a 'Pagado' y registra la fecha de hoy
    @PutMapping("/{id}/pagar")
    @Transactional
    public ResponseEntity<?> pagarCuota(@PathVariable Long id) {
        return cuotaMensualRepository.findById(id)
                .map(cuota -> {
                    cuota.setEstado("Pagado");
                    cuota.setFechaPago(LocalDate.now());
                    cuotaMensualRepository.save(cuota);
                    return ResponseEntity.ok(Map.of("mensaje", "Cuota pagada con éxito"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}