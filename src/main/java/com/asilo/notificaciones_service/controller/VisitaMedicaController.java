package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.dto.VisitaMedicaDTO;
import com.asilo.notificaciones_service.model.*;
import com.asilo.notificaciones_service.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
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
        visita.setCostoConsulta(dto.getCostoConsulta() != null ? dto.getCostoConsulta() : 0.0);
        visita.setEstadoPago("PENDIENTE");
        visita.setFechaRegistro(LocalDateTime.now());

        VisitaMedica visitaGuardada = visitaMedicaRepository.save(visita);

        // 2. Guardar Exámenes de Laboratorio si se solicitaron
        if (dto.getExamenes() != null && !dto.getExamenes().isEmpty()) {
            for (VisitaMedicaDTO.ExamenDTO exDto : dto.getExamenes()) {
                ExamenLaboratorio ex = new ExamenLaboratorio();
                ex.setIdVisita(visitaGuardada.getIdVisita());
                ex.setNombreExamen(exDto.getNombreExamen());
                ex.setCostoExamen(exDto.getCostoExamen() != null ? exDto.getCostoExamen() : 0.0);
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
                
                // Conversión explícita de Double a BigDecimal
                if (recDto.getCostoMedicamento() != null) {
                    rec.setCostoMedicamento(BigDecimal.valueOf(recDto.getCostoMedicamento()));
                } else {
                    rec.setCostoMedicamento(BigDecimal.ZERO);
                }

                rec.setEstado("PENDIENTE_ENTREGA");
                recetaRepository.save(rec);
            }
        }

        // 4. Actualizar estado de la Solicitud a COMPLETADA
        if (dto.getIdSolicitud() != null) {
            solicitudRepository.findById(dto.getIdSolicitud()).ifPresent(sol -> {
                sol.setEstado("COMPLETADA");
                solicitudRepository.save(sol);
            });
        }

        return ResponseEntity.ok(visitaGuardada);
    }

    @GetMapping("/paciente/{idPaciente}")
    public ResponseEntity<List<VisitaMedica>> obtenerHistorialPaciente(@PathVariable Integer idPaciente) {
        return ResponseEntity.ok(visitaMedicaRepository.findByIdPaciente(idPaciente));
    }

    // NUEVO: Permite consultar únicamente las visitas/citas del médico especialista logueado
    @GetMapping("/medico/{idMedicoEspecialista}")
    public ResponseEntity<List<VisitaMedica>> obtenerVisitasPorMedico(@PathVariable Integer idMedicoEspecialista) {
        return ResponseEntity.ok(visitaMedicaRepository.findByIdMedicoEspecialista(idMedicoEspecialista));
    }
}