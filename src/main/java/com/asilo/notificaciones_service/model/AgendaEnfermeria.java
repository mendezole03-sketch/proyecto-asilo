package com.asilo.notificaciones_service.model;

import jakarta.persistence.*;

@Entity
@Table(name = "agenda_enfermeria")
public class AgendaEnfermeria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_asignacion")
    private Long idAsignacion;

    @Column(name = "id_enfermero")
    private Long idEnfermero;

    @Column(name = "id_solicitud")
    private Long idSolicitud;

    @Column(name = "nombre_paciente")
    private String nombrePaciente;

    @Column(name = "turno_asignado")
    private String turnoAsignado;

    @Column(name = "estado")
    private String estado;

    // --- GETTERS Y SETTERS ---
    public Long getIdAsignacion() { return idAsignacion; }
    public void setIdAsignacion(Long idAsignacion) { this.idAsignacion = idAsignacion; }

    public Long getIdEnfermero() { return idEnfermero; }
    public void setIdEnfermero(Long idEnfermero) { this.idEnfermero = idEnfermero; }

    public Long getIdSolicitud() { return idSolicitud; }
    public void setIdSolicitud(Long idSolicitud) { this.idSolicitud = idSolicitud; }

    public String getNombrePaciente() { return nombrePaciente; }
    public void setNombrePaciente(String nombrePaciente) { this.nombrePaciente = nombrePaciente; }

    public String getTurnoAsignado() { return turnoAsignado; }
    public void setTurnoAsignado(String turnoAsignado) { this.turnoAsignado = turnoAsignado; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}