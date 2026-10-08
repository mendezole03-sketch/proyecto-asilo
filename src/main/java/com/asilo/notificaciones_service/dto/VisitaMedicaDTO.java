package com.asilo.notificaciones_service.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class VisitaMedicaDTO {
    private Long idSolicitud;
    private Integer idPaciente;
    private Integer idMedicoEspecialista;
    private LocalDate fechaVisita;
    private String motivoVisita;
    private String diagnostico;
    private String observaciones;
    private Double costoConsulta;

    // Inicializamos las listas vacías para prevenir NullPointerException
    private List<ExamenDTO> examenes = new ArrayList<>();
    private List<RecetaDTO> recetas = new ArrayList<>();

    // --- GETTERS Y SETTERS ---

    public Long getIdSolicitud() { return idSolicitud; }
    public void setIdSolicitud(Long idSolicitud) { this.idSolicitud = idSolicitud; }

    public Integer getIdPaciente() { return idPaciente; }
    public void setIdPaciente(Integer idPaciente) { this.idPaciente = idPaciente; }

    public Integer getIdMedicoEspecialista() { return idMedicoEspecialista; }
    public void setIdMedicoEspecialista(Integer idMedicoEspecialista) { this.idMedicoEspecialista = idMedicoEspecialista; }

    public LocalDate getFechaVisita() { return fechaVisita; }
    public void setFechaVisita(LocalDate fechaVisita) { this.fechaVisita = fechaVisita; }

    public String getMotivoVisita() { return motivoVisita; }
    public void setMotivoVisita(String motivoVisita) { this.motivoVisita = motivoVisita; }

    public String getDiagnostico() { return diagnostico; }
    public void setDiagnostico(String diagnostico) { this.diagnostico = diagnostico; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public Double getCostoConsulta() { return costoConsulta; }
    public void setCostoConsulta(Double costoConsulta) { this.costoConsulta = costoConsulta; }

    public List<ExamenDTO> getExamenes() { return examenes; }
    public void setExamenes(List<ExamenDTO> examenes) { this.examenes = examenes; }

    public List<RecetaDTO> getRecetas() { return recetas; }
    public void setRecetas(List<RecetaDTO> recetas) { this.recetas = recetas; }

    // --- SUBCLASES ---

    public static class ExamenDTO {
        private String nombreExamen;
        private Double costoExamen;

        public String getNombreExamen() { return nombreExamen; }
        public void setNombreExamen(String nombreExamen) { this.nombreExamen = nombreExamen; }

        public Double getCostoExamen() { return costoExamen; }
        public void setCostoExamen(Double costoExamen) { this.costoExamen = costoExamen; }
    }

    public static class RecetaDTO {
        private String medicamento;
        private String dosis;
        private String tiempoAplicacion;
        private Double costoMedicamento;

        public String getMedicamento() { return medicamento; }
        public void setMedicamento(String medicamento) { this.medicamento = medicamento; }

        public String getDosis() { return dosis; }
        public void setDosis(String dosis) { this.dosis = dosis; }

        public String getTiempoAplicacion() { return tiempoAplicacion; }
        public void setTiempoAplicacion(String tiempoAplicacion) { this.tiempoAplicacion = tiempoAplicacion; }

        public Double getCostoMedicamento() { return costoMedicamento; }
        public void setCostoMedicamento(Double costoMedicamento) { this.costoMedicamento = costoMedicamento; }
    }
}