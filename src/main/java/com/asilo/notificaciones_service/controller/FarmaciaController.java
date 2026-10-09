package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.model.CuentaFamiliar;
import com.asilo.notificaciones_service.model.RecetaMedicamento;
import com.asilo.notificaciones_service.repository.CuentaFamiliarRepository;
import com.asilo.notificaciones_service.repository.FarmaciaRepository;
import com.asilo.notificaciones_service.repository.VisitaMedicaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/farmacia")
@CrossOrigin(origins = "*")
public class FarmaciaController {

    @Autowired
    private FarmaciaRepository farmaciaRepository;

    @Autowired
    private VisitaMedicaRepository visitaMedicaRepository;

    @Autowired
    private CuentaFamiliarRepository cuentaFamiliarRepository;

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
    @Transactional
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

            // --- ACTUALIZACIÓN AUTOMÁTICA EN LA CAJA (CUENTA FAMILIAR) ---
            if (guardado.getIdVisita() != null) {
                visitaMedicaRepository.findById(guardado.getIdVisita()).ifPresent(visita -> {
                    
                    // 1. Obtener todas las recetas de esta visita médica para sumar el subtotal actualizado de farmacia
                    List<RecetaMedicamento> todasLasRecetas = farmaciaRepository.findByIdVisita(visita.getIdVisita());
                    double nuevoSubtotalMedicamentos = todasLasRecetas.stream()
                            .mapToDouble(r -> r.getCostoMedicamento() != null ? r.getCostoMedicamento().doubleValue() : 0.0)
                            .sum();

                    // 2. Buscar la cuenta familiar del paciente y actualizar su subtotal de medicamentos
                    if (visita.getIdPaciente() != null) {
                        List<CuentaFamiliar> cuentas = cuentaFamiliarRepository.findAll();
                        for (CuentaFamiliar c : cuentas) {
                            if (c.getPaciente() != null && c.getPaciente().getIdPaciente().equals(visita.getIdPaciente())) {
                                c.setSubtotalMedicamentos(nuevoSubtotalMedicamentos);

                                // Recalcular el monto bruto y el total a pagar general
                                double consulta = c.getSubtotalConsulta() != null ? c.getSubtotalConsulta() : 0.0;
                                double examenes = c.getSubtotalExamenes() != null ? c.getSubtotalExamenes() : 0.0;
                                double bruto = consulta + examenes + nuevoSubtotalMedicamentos;
                                double descuento = c.getDescuentoFundacion() != null ? c.getDescuentoFundacion() : 0.0;

                                c.setMontoTotalBruto(bruto);
                                c.setMontoFinalAPagar(bruto - descuento);

                                cuentaFamiliarRepository.save(c);
                                break;
                            }
                        }
                    }
                });
            }

            return ResponseEntity.ok(guardado);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al despachar medicamento: " + e.getMessage()));
        }
    }
}