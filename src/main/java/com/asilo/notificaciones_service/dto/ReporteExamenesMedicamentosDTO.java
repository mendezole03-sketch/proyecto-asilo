package com.asilo.notificaciones_service.dto;

import java.time.LocalDate;

public class ReporteExamenesMedicamentosDTO {
    private Long idVisita;
    private String nombrePaciente;
    private LocalDate fechaVisita;
    private String tipoExamen;
    private Double costoExamen;
    private String nombreMedicamento;
    private Double costoMedicamento;

    public ReporteExamenesMedicamentosDTO(Long idVisita, String nombrePaciente, LocalDate fechaVisita, 
                                          String tipoExamen, Double costoExamen, 
                                          String nombreMedicamento, Double costoMedicamento) {
        this.idVisita = idVisita;
        this.nombrePaciente = nombrePaciente;
        this.fechaVisita = fechaVisita;
        this.tipoExamen = tipoExamen;
        this.costoExamen = costoExamen;
        this.nombreMedicamento = nombreMedicamento;
        this.costoMedicamento = costoMedicamento;
    }

    // Getters
    public Long getIdVisita() { return idVisita; }
    public String getNombrePaciente() { return nombrePaciente; }
    public LocalDate getFechaVisita() { return fechaVisita; }
    public String getTipoExamen() { return tipoExamen; }
    public Double getCostoExamen() { return costoExamen; }
    public String getNombreMedicamento() { return nombreMedicamento; }
    public Double getCostoMedicamento() { return costoMedicamento; }
}