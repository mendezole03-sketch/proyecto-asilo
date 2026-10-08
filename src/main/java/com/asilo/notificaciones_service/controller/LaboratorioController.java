package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.dto.ExamenLaboratorioResponseDTO;
import com.asilo.notificaciones_service.model.ExamenLaboratorio;
import com.asilo.notificaciones_service.repository.ExamenLaboratorioRepository;
import com.asilo.notificaciones_service.repository.PacienteRepository;
import com.asilo.notificaciones_service.repository.VisitaMedicaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/examenes")
@CrossOrigin(origins = "*")
public class LaboratorioController {

    @Autowired
    private ExamenLaboratorioRepository examenRepository;

    @Autowired
    private VisitaMedicaRepository visitaMedicaRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    /**
     * GET /api/examenes
     * Obtiene la lista completa de exámenes enriquecida con datos del Paciente y de la Solicitud
     */
    @GetMapping
    public ResponseEntity<?> obtenerTodosLosExamenes() {
        try {
            List<ExamenLaboratorio> listaExamenes = examenRepository.findAll();
            List<ExamenLaboratorioResponseDTO> respuesta = new ArrayList<>();

            for (ExamenLaboratorio ex : listaExamenes) {
                ExamenLaboratorioResponseDTO dto = new ExamenLaboratorioResponseDTO();
                dto.setIdExamen(ex.getIdExamen());
                dto.setIdVisita(ex.getIdVisita());
                dto.setNombreExamen(ex.getNombreExamen());
                dto.setCostoExamen(ex.getCostoExamen());
                dto.setEstado(ex.getEstado());
                dto.setResultado(ex.getResultado());

                // Buscar la visita para obtener idSolicitud e idPaciente
                if (ex.getIdVisita() != null) {
                    visitaMedicaRepository.findById(ex.getIdVisita()).ifPresent(visita -> {
                        dto.setIdSolicitud(visita.getIdSolicitud());
                        dto.setIdPaciente(visita.getIdPaciente());

                        // Buscar el paciente para obtener su nombre real
                        // Buscar el paciente para obtener su nombre real
                        if (visita.getIdPaciente() != null) {
                            pacienteRepository.findById(visita.getIdPaciente()).ifPresent(paciente -> {
                                String nombreCompleto = paciente.getNombre();
                                dto.setNombrePaciente(nombreCompleto);
                            });
                        }
                    });
                }

                if (dto.getNombrePaciente() == null) {
                    dto.setNombrePaciente("Paciente No Identificado");
                }

                respuesta.add(dto);
            }

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al obtener exámenes: " + e.getMessage()));
        }
    }

    /**
     * GET /api/examenes/visita/{idVisita}
     */
    @GetMapping("/visita/{idVisita}")
    public ResponseEntity<?> obtenerExamenesPorVisita(@PathVariable("idVisita") Long idVisita) {
        try {
            List<ExamenLaboratorio> lista = examenRepository.findByIdVisita(idVisita);
            return ResponseEntity.ok(lista);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al consultar exámenes de la visita: " + e.getMessage()));
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