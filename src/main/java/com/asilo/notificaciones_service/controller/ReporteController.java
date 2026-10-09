package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.dto.ReporteCitaCostosDTO;
import com.asilo.notificaciones_service.dto.ReporteFichaMedicaDTO;
import com.asilo.notificaciones_service.dto.ReporteCobrosFechaDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/reportes")
@CrossOrigin(origins = "*")
public class ReporteController {

    @Autowired
    private DataSource dataSource;

    @GetMapping("/costos-citas")
    public ResponseEntity<List<ReporteCitaCostosDTO>> obtenerCostosPorCita() {
        List<ReporteCitaCostosDTO> reporte = new ArrayList<>();
        
        String sql = "SELECT v.id_visita, p.nombre AS nombre_paciente, v.fecha_registro, v.costo_consulta, " +
                     "ISNULL((SELECT SUM(e.costo_examen) FROM examen_laboratorio e WHERE e.id_visita = v.id_visita), 0) AS costo_examenes, " +
                     "ISNULL((SELECT SUM(m.costo_medicamento) FROM receta_medicamento m WHERE m.id_visita = v.id_visita), 0) AS costo_medicamentos " +
                     "FROM visita_medica v " +
                     "JOIN Paciente p ON v.id_paciente = p.idPaciente";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                ReporteCitaCostosDTO dto = new ReporteCitaCostosDTO(
                    rs.getLong("id_visita"),
                    rs.getString("nombre_paciente"),
                    rs.getDate("fecha_registro") != null ? rs.getDate("fecha_registro").toLocalDate() : null,
                    rs.getDouble("costo_consulta"),
                    rs.getDouble("costo_examenes"),
                    rs.getDouble("costo_medicamentos")
                );
                reporte.add(dto);
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }

        return ResponseEntity.ok(reporte);
    }

    @GetMapping("/ficha-medica")
    public ResponseEntity<List<ReporteFichaMedicaDTO>> obtenerReporteFichaMedica() {
        List<ReporteFichaMedicaDTO> reporte = new ArrayList<>();
        
        String sql = "SELECT p.idPaciente, p.nombre, p.fechaIngreso, p.diagnosticoInicial, " +
                     "p.motivo_reclusion, p.psicopatologias, p.medicamentosCajon, " +
                     "f.nombre AS nombre_familiar, f.telefono AS telefono_familiar " +
                     "FROM Paciente p " +
                     "LEFT JOIN Familiar f ON p.id_familiar = f.idFamiliar " +
                     "WHERE p.activo = 1";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                ReporteFichaMedicaDTO dto = new ReporteFichaMedicaDTO(
                    rs.getInt("idPaciente"),
                    rs.getString("nombre"),
                    rs.getDate("fechaIngreso") != null ? rs.getDate("fechaIngreso").toLocalDate() : null,
                    rs.getString("diagnosticoInicial"),
                    rs.getString("motivo_reclusion"),
                    rs.getString("psicopatologias"),
                    rs.getString("medicamentosCajon"),
                    rs.getString("nombre_familiar"),
                    rs.getString("telefono_familiar")
                );
                reporte.add(dto);
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }

        return ResponseEntity.ok(reporte);
    }

    @GetMapping("/cobros-fecha")
    public ResponseEntity<List<ReporteCobrosFechaDTO>> obtenerCobrosPorFecha(
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin) {
        
        List<ReporteCobrosFechaDTO> reporte = new ArrayList<>();
        
        StringBuilder sql = new StringBuilder(
            "SELECT v.id_visita, p.nombre AS nombre_paciente, v.fecha_registro, v.costo_consulta, v.estado_pago, " +
            "ISNULL((SELECT SUM(e.costo_examen) FROM examen_laboratorio e WHERE e.id_visita = v.id_visita), 0) AS costo_examenes, " +
            "ISNULL((SELECT SUM(m.costo_medicamento) FROM receta_medicamento m WHERE m.id_visita = v.id_visita), 0) AS costo_medicamentos, " +
            "(v.costo_consulta + " +
            "ISNULL((SELECT SUM(e.costo_examen) FROM examen_laboratorio e WHERE e.id_visita = v.id_visita), 0) + " +
            "ISNULL((SELECT SUM(m.costo_medicamento) FROM receta_medicamento m WHERE m.id_visita = v.id_visita), 0)) AS costo_total " +
            "FROM visita_medica v " +
            "JOIN Paciente p ON v.id_paciente = p.idPaciente WHERE 1=1"
        );

        if (fechaInicio != null && !fechaInicio.isEmpty()) {
            sql.append(" AND v.fecha_registro >= ?");
        }
        if (fechaFin != null && !fechaFin.isEmpty()) {
            sql.append(" AND v.fecha_registro <= ?");
        }

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {

            int paramIndex = 1;
            if (fechaInicio != null && !fechaInicio.isEmpty()) {
                stmt.setString(paramIndex++, fechaInicio);
            }
            if (fechaFin != null && !fechaFin.isEmpty()) {
                stmt.setString(paramIndex++, fechaFin);
            }

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    ReporteCobrosFechaDTO dto = new ReporteCobrosFechaDTO(
                        rs.getLong("id_visita"),
                        rs.getString("nombre_paciente"),
                        rs.getDate("fecha_registro") != null ? rs.getDate("fecha_registro").toLocalDate() : null,
                        rs.getDouble("costo_consulta"),
                        rs.getDouble("costo_examenes"),
                        rs.getDouble("costo_medicamentos"),
                        rs.getDouble("costo_total"),
                        rs.getString("estado_pago")
                    );
                    reporte.add(dto);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }

        return ResponseEntity.ok(reporte);
    }
}