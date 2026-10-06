package com.asilo.notificaciones_service.model;

import jakarta.persistence.*;

@Entity
@Table(name = "receta_medicamento", schema = "dbo")
public class RecetaMedicamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_receta")
    private Long idReceta;

    @Column(name = "id_visita", nullable = false)
    private Long idVisita;

    @Column(name = "medicamento")
    private String medicamento;

    @Column(name = "dosis")
    private String dosis;

    @Column(name = "tiempo_aplicacion")
    private String tiempoAplicacion;

    @Column(name = "costo_medicamento")
    private Double costoMedicamento;

    @Column(name = "estado")
    private String estado;

    public Long getIdReceta() {
        return idReceta;
    }

    public void setIdReceta(Long idReceta) {
        this.idReceta = idReceta;
    }

    public Long getIdVisita() {
        return idVisita;
    }

    public void setIdVisita(Long idVisita) {
        this.idVisita = idVisita;
    }

    public String getMedicamento() {
        return medicamento;
    }

    public void setMedicamento(String medicamento) {
        this.medicamento = medicamento;
    }

    public String getDosis() {
        return dosis;
    }

    public void setDosis(String dosis) {
        this.dosis = dosis;
    }

    public String getTiempoAplicacion() {
        return tiempoAplicacion;
    }

    public void setTiempoAplicacion(String tiempoAplicacion) {
        this.tiempoAplicacion = tiempoAplicacion;
    }

    public Double getCostoMedicamento() {
        return costoMedicamento;
    }

    public void setCostoMedicamento(Double costoMedicamento) {
        this.costoMedicamento = costoMedicamento;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}