package com.asilo.notificaciones_service.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Solicitudes")
public class Solicitud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idSolicitud")
    private Long idSolicitud;

    @Column(name = "idPaciente", nullable = false)
    private Long idPaciente;

    @Column(name = "nombrePaciente", nullable = false)
    private String nombrePaciente;

    @Column(name = "nombreFamiliar")
    private String nombreFamiliar;

    @Column(name = "correoFamiliar")
    private String correoFamiliar;

    @Column(name = "medicoEspecialista", nullable = false)
    private String medicoEspecialista;

    @Column(name = "idMedicoEspecialista", nullable = true)
    private Long idMedicoEspecialista;

    @Column(name = "idEnfermero", nullable = false)
    private Long idEnfermero;

    @Column(name = "motivo")
    private String motivo;

    @Column(name = "fechaSolicitud", insertable = false, updatable = false)
    private LocalDateTime fechaSolicitud;

    public Solicitud() {}

    public Long getIdSolicitud() { return idSolicitud; }
    public void setIdSolicitud(Long idSolicitud) { this.idSolicitud = idSolicitud; }

    public Long getIdPaciente() { return idPaciente; }
    public void setIdPaciente(Long idPaciente) { this.idPaciente = idPaciente; }

    public String getNombrePaciente() { return nombrePaciente; }
    public void setNombrePaciente(String nombrePaciente) { this.nombrePaciente = nombrePaciente; }

    public String getNombreFamiliar() { return nombreFamiliar; }
    public void setNombreFamiliar(String nombreFamiliar) { this.nombreFamiliar = nombreFamiliar; }

    public String getCorreoFamiliar() { return correoFamiliar; }
    public void setCorreoFamiliar(String correoFamiliar) { this.correoFamiliar = correoFamiliar; }

    public String getMedicoEspecialista() { return medicoEspecialista; }
    public void setMedicoEspecialista(String medicoEspecialista) { this.medicoEspecialista = medicoEspecialista; }

    public Long getIdMedicoEspecialista() { return idMedicoEspecialista; }
    public void setIdMedicoEspecialista(Long idMedicoEspecialista) { this.idMedicoEspecialista = idMedicoEspecialista; }

    public Long getIdEnfermero() { return idEnfermero; }
    public void setIdEnfermero(Long idEnfermero) { this.idEnfermero = idEnfermero; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public LocalDateTime getFechaSolicitud() { return fechaSolicitud; }
    public void setFechaSolicitud(LocalDateTime fechaSolicitud) { this.fechaSolicitud = fechaSolicitud; }
}