package com.asilo.notificaciones_service.dto;

import java.time.LocalDate;

public class ReporteCobrosFechaDTO {
    private Long idVisita;
    private String nombrePaciente;
    private LocalDate fechaVisita;
    private Double costoConsulta;
    private Double costoExamenes;
    private Double costoMedicamentos;
    private Double costoTotal;
    private String estadoPago;

    public ReporteCobrosFechaDTO(Long idVisita, String nombrePaciente, LocalDate fechaVisita, 
                                 Double costoConsulta, Double costoExamenes, Double costoMedicamentos, 
                                 Double costoTotal, String estadoPago) {
        this.idVisita = idVisita;
        this.nombrePaciente = nombrePaciente;
        this.fechaVisita = fechaVisita;
        this.costoConsulta = costoConsulta;
        this.costoExamenes = costoExamenes;
        this.costoMedicamentos = costoMedicamentos;
        this.costoTotal = costoTotal;
        this.estadoPago = estadoPago;
    }

    // Getters
    public Long getIdVisita() { return idVisita; }
    public String getNombrePaciente() { return nombrePaciente; }
    public LocalDate getFechaVisita() { return fechaVisita; }
    public Double getCostoConsulta() { return costoConsulta; }
    public Double getCostoExamenes() { return costoExamenes; }
    public Double getCostoMedicamentos() { return costoMedicamentos; }
    public Double getCostoTotal() { return costoTotal; }
    public String getEstadoPago() { return estadoPago; }
}