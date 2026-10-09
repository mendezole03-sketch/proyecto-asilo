package com.asilo.notificaciones_service.dto;

import java.time.LocalDate;

public class ReporteFichaMedicaDTO {
    private Integer idPaciente;
    private String nombrePaciente;
    private LocalDate fechaIngreso;
    private String diagnosticoInicial;
    private String motivoReclusion;
    private String psicopatologias;
    private String medicamentosCajon;
    private String nombreFamiliar;
    private String telefonoFamiliar;

    public ReporteFichaMedicaDTO(Integer idPaciente, String nombrePaciente, LocalDate fechaIngreso, 
                                 String diagnosticoInicial, String motivoReclusion, String psicopatologias, 
                                 String medicamentosCajon, String nombreFamiliar, String telefonoFamiliar) {
        this.idPaciente = idPaciente;
        this.nombrePaciente = nombrePaciente;
        this.fechaIngreso = fechaIngreso;
        this.diagnosticoInicial = diagnosticoInicial;
        this.motivoReclusion = motivoReclusion;
        this.psicopatologias = psicopatologias;
        this.medicamentosCajon = medicamentosCajon;
        this.nombreFamiliar = nombreFamiliar;
        this.telefonoFamiliar = telefonoFamiliar;
    }

    // Getters
    public Integer getIdPaciente() { return idPaciente; }
    public String getNombrePaciente() { return nombrePaciente; }
    public LocalDate getFechaIngreso() { return fechaIngreso; }
    public String getDiagnosticoInicial() { return diagnosticoInicial; }
    public String getMotivoReclusion() { return motivoReclusion; }
    public String getPsicopatologias() { return psicopatologias; }
    public String getMedicamentosCajon() { return medicamentosCajon; }
    public String getNombreFamiliar() { return nombreFamiliar; }
    public String getTelefonoFamiliar() { return telefonoFamiliar; }
}