package com.asilo.notificaciones_service.dto;

import java.time.LocalDate;

public class ReportePagoDonacionDTO {
    private Long idRegistro;
    private String tipoIngreso; // "CUOTA MENSUAL" o "DONACIÓN"
    private String fuente;      // Nombre del familiar o del donante
    private Double monto;
    private LocalDate fecha;
    private String detalle;     // Mes correspondiente o descripción

    public ReportePagoDonacionDTO(Long idRegistro, String tipoIngreso, String fuente, Double monto, LocalDate fecha, String detalle) {
        this.idRegistro = idRegistro;
        this.tipoIngreso = tipoIngreso;
        this.fuente = fuente;
        this.monto = monto;
        this.fecha = fecha;
        this.detalle = detalle;
    }

    // Getters
    public Long getIdRegistro() { return idRegistro; }
    public String getTipoIngreso() { return tipoIngreso; }
    public String getFuente() { return fuente; }
    public Double getMonto() { return monto; }
    public LocalDate fecha() { return fecha; }
    public LocalDate getFecha() { return fecha; }
    public String getDetalle() { return detalle; }
}