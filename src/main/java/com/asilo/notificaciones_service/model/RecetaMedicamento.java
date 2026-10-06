package com.asilo.notificaciones_service.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "receta_medicamento")
public class RecetaMedicamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_receta")
    private Long idReceta;

    @Column(name = "id_visita")
    private Long idVisita;

    @Column(name = "medicamento")
    private String medicamento;

    @Column(name = "dosis")
    private String dosis;

    @Column(name = "tiempo_aplicacion")
    private String tiempoAplicacion;

    @Column(name = "costo_medicamento")
    private BigDecimal costoMedicamento;

    @Column(name = "estado")
    private String estado = "PENDIENTE_ENTREGA";

    public RecetaMedicamento() {}

    // Getters y Setters
    public Long getIdReceta() { return idReceta; }
    public void setIdReceta(Long idReceta) { this.idReceta = idReceta; }

    public Long getIdVisita() { return idVisita; }
    public void setIdVisita(Long idVisita) { this.idVisita = idVisita; }

    public String getMedicamento() { return medicamento; }
    public void setMedicamento(String medicamento) { this.medicamento = medicamento; }

    public String getDosis() { return dosis; }
    public void setDosis(String dosis) { this.dosis = dosis; }

    public String getTiempoAplicacion() { return tiempoAplicacion; }
    public void setTiempoAplicacion(String tiempoAplicacion) { this.tiempoAplicacion = tiempoAplicacion; }

    public BigDecimal getCostoMedicamento() { return costoMedicamento; }
    public void setCostoMedicamento(BigDecimal costoMedicamento) { this.costoMedicamento = costoMedicamento; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}