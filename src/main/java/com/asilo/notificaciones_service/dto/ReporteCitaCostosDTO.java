package com.asilo.notificaciones_service.dto;

import java.time.LocalDate;

public class ReporteCitaCostosDTO {
    private Long idVisita;
    private String nombrePaciente;
    private LocalDate fechaVisita;
    private Double costoConsulta;
    private Double costoExamenes;
    private Double costoMedicamentos;
    private Double costoTotal;

    // Constructor, Getters y Setters
    public ReporteCitaCostosDTO(Long idVisita, String nombrePaciente, LocalDate fechaVisita, 
                                Double costoConsulta, Double costoExamenes, Double costoMedicamentos) {
        this.idVisita = idVisita;
        this.nombrePaciente = nombrePaciente;
        this.fechaVisita = fechaVisita;
        this.costoConsulta = costoConsulta != null ? costoConsulta : 0.0;
        this.costoExamenes = costoExamenes != null ? costoExamenes : 0.0;
        this.costoMedicamentos = costoMedicamentos != null ? costoMedicamentos : 0.0;
        this.costoTotal = this.costoConsulta + this.costoExamenes + this.costoMedicamentos;
    }

    public Long getIdVisita() { return idVisita; }
    public String getNombrePaciente() { return nombrePaciente; }
    public LocalDate getFechaVisita() { return fechaVisita; }
    public Double getCostoConsulta() { return costoConsulta; }
    public Double getCostoExamenes() { return costoExamenes; }
    public Double getCostoMedicamentos() { return costoMedicamentos; }
    public Double getCostoTotal() { return costoTotal; }
}