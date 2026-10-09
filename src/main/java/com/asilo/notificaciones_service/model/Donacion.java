package com.asilo.notificaciones_service.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = " donaciones") 
public class Donacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_donacion")
    private Long idDonacion;

    @Column(name = "tipo_donante", nullable = false)
    private String tipoDonante;

    @Column(name = "nombre_donante", nullable = false)
    private String nombreDonante;

    @Column(name = "monto", nullable = false)
    private Double monto;

    @Column(name = "descripcion")
    private String descripcion;

    @Column(name = "fecha_donacion")
    private LocalDate fechaDonacion;

    // Se ejecuta automáticamente antes de guardar para poner la fecha de hoy si viene vacía
    @PrePersist
    public void prePersist() {
        if (this.fechaDonacion == null) {
            this.fechaDonacion = LocalDate.now();
        }
    }

    // Getters y Setters
    public Long getIdDonacion() {
        return idDonacion;
    }

    public void setIdDonacion(Long idDonacion) {
        this.idDonacion = idDonacion;
    }

    public String getTipoDonante() {
        return tipoDonante;
    }

    public void setTipoDonante(String tipoDonante) {
        this.tipoDonante = tipoDonante;
    }

    public String getNombreDonante() {
        return nombreDonante;
    }

    public void setNombreDonante(String nombreDonante) {
        this.nombreDonante = nombreDonante;
    }

    public Double getMonto() {
        return monto;
    }

    public void setMonto(Double monto) {
        this.monto = monto;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public LocalDate getFechaDonacion() {
        return fechaDonacion;
    }

    public void setFechaDonacion(LocalDate fechaDonacion) {
        this.fechaDonacion = fechaDonacion;
    }
}