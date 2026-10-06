package com.asilo.notificaciones_service.model;

import jakarta.persistence.*;

@Entity
@Table(name = "examen_laboratorio", schema = "dbo")
public class ExamenLaboratorio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_examen")
    private Long idExamen;

    @Column(name = "id_visita", nullable = false)
    private Long idVisita;

    @Column(name = "nombre_examen")
    private String nombreExamen; // ej. Hemograma, Glucosa, etc.
    
    @Column(name = "resultado", length = 2000)
    private String resultado; // Lo llena el laboratorio clínico posteriormente

    @Column(name = "costo_examen")
    private Double costoExamen; // Precio especial otorgado por la fundación

    @Column(name = "estado")
    private String estado = "ORDENADO"; // ORDENADO, REALIZADO, CANCELADO

    public Long getIdExamen() {
        return idExamen;
    }

    public void setIdExamen(Long idExamen) {
        this.idExamen = idExamen;
    }

    public Long getIdVisita() {
        return idVisita;
    }

    public void setIdVisita(Long idVisita) {
        this.idVisita = idVisita;
    }

    public String getNombreExamen() {
        return nombreExamen;
    }

    public void setNombreExamen(String nombreExamen) {
        this.nombreExamen = nombreExamen;
    }

    public String getResultado() {
        return resultado;
    }

    public void setResultado(String resultado) {
        this.resultado = resultado;
    }

    public Double getCostoExamen() {
        return costoExamen;
    }

    public void setCostoExamen(Double costoExamen) {
        this.costoExamen = costoExamen;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}