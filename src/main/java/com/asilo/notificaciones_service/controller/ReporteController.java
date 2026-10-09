package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.dto.ReporteCitaCostosDTO;
import com.asilo.notificaciones_service.dto.ReporteFichaMedicaDTO;
import com.asilo.notificaciones_service.dto.ReporteCobrosFechaDTO;
import com.asilo.notificaciones_service.dto.ReportePagoDonacionDTO;
import com.asilo.notificaciones_service.dto.ReporteExamenesMedicamentosDTO;
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

    @GetMapping("/pagos-fundacion")
    public ResponseEntity<List<ReportePagoDonacionDTO>> obtenerPagosYDonaciones() {
        List<ReportePagoDonacionDTO> reporte = new ArrayList<>();
        
        String sql = 
            "SELECT c.id_cuota AS id_registro, 'CUOTA MENSUAL' AS tipo_ingreso, f.nombre AS fuente, c.monto, c.fecha_pago AS fecha, c.mes_correspondiente AS detalle " +
            "FROM cuotas_mensuales c " +
            "LEFT JOIN Familiar f ON c.id_familiar = f.idFamiliar " +
            "WHERE c.estado = 'PAGADO' " +
            "UNION ALL " +
            "SELECT d.id_donacion AS id_registro, 'DONACIÓN' AS tipo_ingreso, d.nombre_donante AS fuente, d.monto, d.fecha_donacion AS fecha, d.descripcion AS detalle " +
            "FROM donaciones d " +
            "ORDER BY fecha DESC";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                ReportePagoDonacionDTO dto = new ReportePagoDonacionDTO(
                    rs.getLong("id_registro"),
                    rs.getString("tipo_ingreso"),
                    rs.getString("fuente"),
                    rs.getDouble("monto"),
                    rs.getDate("fecha") != null ? rs.getDate("fecha").toLocalDate() : null,
                    rs.getString("detalle")
                );
                reporte.add(dto);
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }

        return ResponseEntity.ok(reporte);
    }

    @GetMapping("/examenes-medicamentos")
    public ResponseEntity<List<ReporteExamenesMedicamentosDTO>> obtenerExamenesYMedicamentos() {
        List<ReporteExamenesMedicamentosDTO> reporte = new ArrayList<>();
        
        // Consulta corregida usando e.nombre_examen y m.medicamento
        String sql = 
            "SELECT v.id_visita, p.nombre AS nombre_paciente, v.fecha_registro, " +
            "e.nombre_examen AS tipo_examen, e.costo_examen, NULL AS nombre_medicamento, NULL AS costo_medicamento " +
            "FROM visita_medica v " +
            "JOIN Paciente p ON v.id_paciente = p.idPaciente " +
            "JOIN examen_laboratorio e ON v.id_visita = e.id_visita " +
            "UNION ALL " +
            "SELECT v.id_visita, p.nombre AS nombre_paciente, v.fecha_registro, " +
            "NULL AS tipo_examen, NULL AS costo_examen, m.medicamento AS nombre_medicamento, m.costo_medicamento " +
            "FROM visita_medica v " +
            "JOIN Paciente p ON v.id_paciente = p.idPaciente " +
            "JOIN receta_medicamento m ON v.id_visita = m.id_visita " +
            "ORDER BY fecha_registro DESC";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                ReporteExamenesMedicamentosDTO dto = new ReporteExamenesMedicamentosDTO(
                    rs.getLong("id_visita"),
                    rs.getString("nombre_paciente"),
                    rs.getDate("fecha_registro") != null ? rs.getDate("fecha_registro").toLocalDate() : null,
                    rs.getString("tipo_examen") != null ? rs.getString("tipo_examen") : "Ninguno",
                    rs.getObject("costo_examen") != null ? rs.getDouble("costo_examen") : 0.0,
                    rs.getString("nombre_medicamento") != null ? rs.getString("nombre_medicamento") : "Ninguno",
                    rs.getObject("costo_medicamento") != null ? rs.getDouble("costo_medicamento") : 0.0
                );
                reporte.add(dto);
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }

        return ResponseEntity.ok(reporte);
    }
}