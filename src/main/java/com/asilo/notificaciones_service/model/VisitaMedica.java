package com.asilo.notificaciones_service.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "visita_medica", schema = "dbo")
public class VisitaMedica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_visita")
    private Long idVisita;

    @Column(name = "id_solicitud")
    private Long idSolicitud; // Referencia a la solicitud que originó la consulta

    @Column(name = "id_paciente", nullable = false)
    private Integer idPaciente;

    @Column(name = "id_medico_especialista", nullable = false)
    private Integer idMedicoEspecialista;

    @Column(length = 2000)
    private String diagnostico;

    @Column(length = 2000)
    private String observaciones;

    @Column(name = "costo_consulta")
    private Double costoConsulta; 

    @Column(name = "estado_pago")
    private String estadoPago = "PENDIENTE"; // PENDIENTE, PAGADO

    @Column(name = "fecha_registro")
    private LocalDateTime fechaRegistro;

    @PrePersist
    public void prePersist() {
        if (this.fechaRegistro == null) {
            this.fechaRegistro = LocalDateTime.now();
        }
    }

    // --- GETTERS Y SETTERS ---

    public Long getIdVisita() {
        return idVisita;
    }

    public void setIdVisita(Long idVisita) {
        this.idVisita = idVisita;
    }

    public Long getIdSolicitud() {
        return idSolicitud;
    }

    public void setIdSolicitud(Long idSolicitud) {
        this.idSolicitud = idSolicitud;
    }

    public Integer getIdPaciente() {
        return idPaciente;
    }

    public void setIdPaciente(Integer idPaciente) {
        this.idPaciente = idPaciente;
    }

    public Integer getIdMedicoEspecialista() {
        return idMedicoEspecialista;
    }

    public void setIdMedicoEspecialista(Integer idMedicoEspecialista) {
        this.idMedicoEspecialista = idMedicoEspecialista;
    }

    public String getDiagnostico() {
        return diagnostico;
    }

    public void setDiagnostico(String diagnostico) {
        this.diagnostico = diagnostico;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public Double getCostoConsulta() {
        return costoConsulta;
    }

    public void setCostoConsulta(Double costoConsulta) {
        this.costoConsulta = costoConsulta;
    }

    public String getEstadoPago() {
        return estadoPago;
    }

    public void setEstadoPago(String estadoPago) {
        this.estadoPago = estadoPago;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(LocalDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }
}