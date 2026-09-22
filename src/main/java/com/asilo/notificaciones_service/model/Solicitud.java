package com.asilo.notificaciones_service.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "Solicitudes", schema = "dbo")
public class Solicitud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idSolicitud")
    private Long idSolicitud;

    @Column(name = "idPaciente", nullable = false)
    private Integer idPaciente;

    @Column(name = "nombrePaciente")
    private String nombrePaciente;

    @Column(name = "nombreFamiliar")
    private String nombreFamiliar;

    @Column(name = "correoFamiliar")
    private String correoFamiliar;

    @Column(name = "medicoEspecialista")
    private String medicoEspecialista; // Especialidad requerida (ej. Cardiología)

    @Column(name = "idMedicoEspecialista")
    private Integer idMedicoEspecialista; // ID del médico usuario asignado por la Fundación

    @Column(name = "idEnfermero")
    private Integer idEnfermero;

    @Column(name = "motivo", length = 1000)
    private String motivo;

    @Column(name = "fechaSolicitud")
    private LocalDate fechaSolicitud;

    @Column(name = "fecha_cita")
    private LocalDate fechaCita;

    @Column(name = "hora_cita", length = 20)
    private String horaCita;

    @Column(name = "estado", length = 20)
    private String estado = "PENDIENTE"; // PENDIENTE, AGENDADA, COMPLETADA, CANCELADA

    // --- CONSTRUCTORES ---

    public Solicitud() {
    }

    public Solicitud(Long idSolicitud, Integer idPaciente, String nombrePaciente, String nombreFamiliar, 
                     String correoFamiliar, String medicoEspecialista, Integer idMedicoEspecialista, 
                     Integer idEnfermero, String motivo, LocalDate fechaSolicitud, LocalDate fechaCita, 
                     String horaCita, String estado) {
        this.idSolicitud = idSolicitud;
        this.idPaciente = idPaciente;
        this.nombrePaciente = nombrePaciente;
        this.nombreFamiliar = nombreFamiliar;
        this.correoFamiliar = correoFamiliar;
        this.medicoEspecialista = medicoEspecialista;
        this.idMedicoEspecialista = idMedicoEspecialista;
        this.idEnfermero = idEnfermero;
        this.motivo = motivo;
        this.fechaSolicitud = fechaSolicitud;
        this.fechaCita = fechaCita;
        this.horaCita = horaCita;
        this.estado = estado != null ? estado : "PENDIENTE";
    }

    // --- GETTERS Y SETTERS ---

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

    public String getNombrePaciente() {
        return nombrePaciente;
    }

    public void setNombrePaciente(String nombrePaciente) {
        this.nombrePaciente = nombrePaciente;
    }

    public String getNombreFamiliar() {
        return nombreFamiliar;
    }

    public void setNombreFamiliar(String nombreFamiliar) {
        this.nombreFamiliar = nombreFamiliar;
    }

    public String getCorreoFamiliar() {
        return correoFamiliar;
    }

    public void setCorreoFamiliar(String correoFamiliar) {
        this.correoFamiliar = correoFamiliar;
    }

    public String getMedicoEspecialista() {
        return medicoEspecialista;
    }

    public void setMedicoEspecialista(String medicoEspecialista) {
        this.medicoEspecialista = medicoEspecialista;
    }

    public Integer getIdMedicoEspecialista() {
        return idMedicoEspecialista;
    }

    public void setIdMedicoEspecialista(Integer idMedicoEspecialista) {
        this.idMedicoEspecialista = idMedicoEspecialista;
    }

    public Integer getIdEnfermero() {
        return idEnfermero;
    }

    public void setIdEnfermero(Integer idEnfermero) {
        this.idEnfermero = idEnfermero;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public LocalDate getFechaSolicitud() {
        return fechaSolicitud;
    }

    public void setFechaSolicitud(LocalDate fechaSolicitud) {
        this.fechaSolicitud = fechaSolicitud;
    }

    public LocalDate getFechaCita() {
        return fechaCita;
    }

    public void setFechaCita(LocalDate fechaCita) {
        this.fechaCita = fechaCita;
    }

    public String getHoraCita() {
        return horaCita;
    }

    public void setHoraCita(String horaCita) {
        this.horaCita = horaCita;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}