package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.model.CuentaFamiliar;
import com.asilo.notificaciones_service.repository.CuentaFamiliarRepository;
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

    @GetMapping("/cuentas")
    public List<CuentaFamiliar> listarCuentasMedicas() {
        return cuentaFamiliarRepository.findAll();
    }

    @PutMapping("/cuentas/{id}/pagar")
    public ResponseEntity<Void> marcarComoPagado(@PathVariable Long id) {
        CuentaFamiliar cuenta = cuentaFamiliarRepository.findById(id).orElse(null);
        if (cuenta != null) {
            cuenta.setEstadoPago("Pagado"); // Actualizado al nombre real de la columna
            cuentaFamiliarRepository.save(cuenta);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}