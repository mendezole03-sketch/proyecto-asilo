package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.model.CuentaFamiliar;
import com.asilo.notificaciones_service.model.VisitaMedica;
import com.asilo.notificaciones_service.repository.CuentaFamiliarRepository;
import com.asilo.notificaciones_service.repository.VisitaMedicaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/caja")
@CrossOrigin(origins = "*")
public class CajaController {

    @Autowired
    private CuentaFamiliarRepository cuentaFamiliarRepository;

    @Autowired
    private VisitaMedicaRepository visitaMedicaRepository;

    @GetMapping("/cuentas")
    public List<CuentaFamiliar> listarCuentasMedicas() {
        return cuentaFamiliarRepository.findAll();
    }

    @PutMapping("/cuentas/{id}/pagar")
    public ResponseEntity<Void> marcarComoPagado(@PathVariable Long id) {
        CuentaFamiliar cuenta = cuentaFamiliarRepository.findById(id).orElse(null);
        
        if (cuenta != null) {
            // 1. Actualizar el estado de la cuenta familiar
            cuenta.setEstadoPago("Pagado"); 
            cuentaFamiliarRepository.save(cuenta);

            // 2. Si tiene un idVisita asociado, buscamos la visita médica y actualizamos su estado
            if (cuenta.getIdVisita() != null) {
                VisitaMedica visita = visitaMedicaRepository.findById(cuenta.getIdVisita()).orElse(null);
                if (visita != null) {
                    visita.setEstadoPago("PAGADO"); // Actualiza el estado en la tabla visita_medica
                    visitaMedicaRepository.save(visita);
                }
            }

            return ResponseEntity.ok().build();
        }
        
        return ResponseEntity.notFound().build();
    }
}