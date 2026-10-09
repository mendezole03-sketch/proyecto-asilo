package com.asilo.notificaciones_service.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "gastos") // Nombre exacto de la tabla en SQL Server[cite: 3]
public class Gasto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_gasto")
    private Long idGasto;

    @Column(name = "concepto", nullable = false)
    private String concepto;

    @Column(name = "monto", nullable = false)
    private Double monto;

    @Column(name = "comprobante")
    private String comprobante;

    @Column(name = "fecha_gasto")
    private LocalDate fechaGasto;

    @Column(name = "registrado_por")
    private String registradoPor;

    // Asigna la fecha actual automáticamente antes de guardar si viene vacía
    @PrePersist
    public void prePersist() {
        if (this.fechaGasto == null) {
            this.fechaGasto = LocalDate.now();
        }
    }

    // Getters y Setters
    public Long getIdGasto() {
        return idGasto;
    }

    public void setIdGasto(Long idGasto) {
        this.idGasto = idGasto;
    }

    public String getConcepto() {
        return concepto;
    }

    public void setConcepto(String concepto) {
        this.concepto = concepto;
    }

    public Double getMonto() {
        return monto;
    }

    public void setMonto(Double monto) {
        this.monto = monto;
    }

    public String getComprobante() {
        return comprobante;
    }

    public void setComprobante(String comprobante) {
        this.comprobante = comprobante;
    }

    public LocalDate getFechaGasto() {
        return fechaGasto;
    }

    public void setFechaGasto(LocalDate fechaGasto) {
        this.fechaGasto = fechaGasto;
    }

    public String getRegistradoPor() {
        return registradoPor;
    }

    public void setRegistradoPor(String registradoPor) {
        this.registradoPor = registradoPor;
    }
}