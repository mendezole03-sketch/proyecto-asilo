package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.dto.VisitaMedicaDTO;
import com.asilo.notificaciones_service.model.*;
import com.asilo.notificaciones_service.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/visitas")
@CrossOrigin(origins = "*")
public class VisitaMedicaController {

    @Autowired
    private VisitaMedicaRepository visitaMedicaRepository;

    @Autowired
    private ExamenLaboratorioRepository examenRepository;

    @Autowired
    private RecetaMedicamentoRepository recetaRepository;

    @Autowired
    private SolicitudRepository solicitudRepository;

    // Repositorios añadidos para conectar con la Caja
    @Autowired
    private CuentaFamiliarRepository cuentaFamiliarRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<?> registrarVisita(@RequestBody VisitaMedicaDTO dto) {
        // Validaciones preventivas de datos obligatorios
        if (dto.getIdPaciente() == null) {
            return ResponseEntity.badRequest().body("Error: El ID del paciente es obligatorio.");
        }
        
        if (dto.getIdMedicoEspecialista() == null) {
            return ResponseEntity.badRequest().body("Error: El ID del médico especialista es obligatorio.");
        }

        // 1. Guardar Visita Médica
        VisitaMedica visita = new VisitaMedica();
        visita.setIdSolicitud(dto.getIdSolicitud());
        visita.setIdPaciente(dto.getIdPaciente());
        visita.setIdMedicoEspecialista(dto.getIdMedicoEspecialista());
        visita.setDiagnostico(dto.getDiagnostico());
        visita.setObservaciones(dto.getObservaciones());
        
        double costoConsulta = dto.getCostoConsulta() != null ? dto.getCostoConsulta() : 0.0;
        visita.setCostoConsulta(costoConsulta);
        visita.setEstadoPago("PENDIENTE");
        visita.setFechaRegistro(LocalDateTime.now());

        VisitaMedica visitaGuardada = visitaMedicaRepository.save(visita);

        // Flag auxiliar para saber si ordenaron exámenes
        boolean tieneExamenes = dto.getExamenes() != null && !dto.getExamenes().isEmpty();

        // Acumuladores de costos para la caja
        double subtotalExamenes = 0.0;
        double subtotalMedicamentos = 0.0;

        // 2. Guardar Exámenes de Laboratorio si se solicitaron
        if (tieneExamenes) {
            for (VisitaMedicaDTO.ExamenDTO exDto : dto.getExamenes()) {
                ExamenLaboratorio ex = new ExamenLaboratorio();
                ex.setIdVisita(visitaGuardada.getIdVisita());
                ex.setNombreExamen(exDto.getNombreExamen());
                
                double costoEx = exDto.getCostoExamen() != null ? exDto.getCostoExamen() : 0.0;
                ex.setCostoExamen(costoEx);
                subtotalExamenes += costoEx; // Sumar al subtotal de laboratorio
                
                ex.setEstado("ORDENADO");
                examenRepository.save(ex);
            }
        }

        // 3. Guardar Medicamentos Recetados si se indicaron
        if (dto.getRecetas() != null && !dto.getRecetas().isEmpty()) {
            for (VisitaMedicaDTO.RecetaDTO recDto : dto.getRecetas()) {
                RecetaMedicamento rec = new RecetaMedicamento();
                rec.setIdVisita(visitaGuardada.getIdVisita());
                rec.setMedicamento(recDto.getMedicamento());
                rec.setDosis(recDto.getDosis());
                rec.setTiempoAplicacion(recDto.getTiempoAplicacion());
                
                double costoMed = 0.0;
                if (recDto.getCostoMedicamento() != null) {
                    costoMed = recDto.getCostoMedicamento();
                    rec.setCostoMedicamento(BigDecimal.valueOf(costoMed));
                } else {
                    rec.setCostoMedicamento(BigDecimal.ZERO);
                }
                subtotalMedicamentos += costoMed; // Sumar al subtotal de farmacia

                rec.setEstado("PENDIENTE_ENTREGA");
                recetaRepository.save(rec);
            }
        }

        // 4. CREAR Y GUARDAR EL REGISTRO EN LA CUENTA FAMILIAR (CAJA)
        double montoBruto = costoConsulta + subtotalExamenes + subtotalMedicamentos;
        double descuentoFundacion = 0.0; 
        double montoFinal = montoBruto - descuentoFundacion;

        CuentaFamiliar cuenta = new CuentaFamiliar();
        
        // Asignamos el ID de la visita recién guardada
        cuenta.setIdVisita(visitaGuardada.getIdVisita());

        // Buscar el paciente, relacionarlo y extraer su familiar automáticamente
        pacienteRepository.findById(dto.getIdPaciente()).ifPresent(paciente -> {
            cuenta.setPaciente(paciente);
            
            // Asignar el familiar vinculado al paciente para evitar el NULL
            if (paciente.getFamiliar() != null) {
                cuenta.setFamiliar(paciente.getFamiliar());
            }
        });

        cuenta.setSubtotalConsulta(costoConsulta);
        cuenta.setSubtotalExamenes(subtotalExamenes);
        cuenta.setSubtotalMedicamentos(subtotalMedicamentos);
        cuenta.setMontoTotalBruto(montoBruto);
        cuenta.setDescuentoFundacion(descuentoFundacion);
        cuenta.setMontoFinalAPagar(montoFinal);
        cuenta.setEstadoPago("PENDIENTE");
        cuenta.setFechaCargo(LocalDate.now());

        cuentaFamiliarRepository.save(cuenta);

        // 5. Actualizar estado de la Solicitud condicionalmente
        if (dto.getIdSolicitud() != null) {
            solicitudRepository.findById(dto.getIdSolicitud()).ifPresent(sol -> {
                if (tieneExamenes) {
                    sol.setEstado("EN_LABORATORIO");
                } else {
                    sol.setEstado("COMPLETADA");
                }
                solicitudRepository.save(sol);
            });
        }

        return ResponseEntity.ok(visitaGuardada);
    }

    @GetMapping("/paciente/{idPaciente}")
    public ResponseEntity<List<VisitaMedica>> obtenerHistorialPaciente(@PathVariable Integer idPaciente) {
        return ResponseEntity.ok(visitaMedicaRepository.findByIdPaciente(idPaciente));
    }

    @GetMapping("/medico/{idMedicoEspecialista}")
    public ResponseEntity<List<VisitaMedica>> obtenerVisitasPorMedico(@PathVariable Integer idMedicoEspecialista) {
        return ResponseEntity.ok(visitaMedicaRepository.findByIdMedicoEspecialista(idMedicoEspecialista));
    }
}