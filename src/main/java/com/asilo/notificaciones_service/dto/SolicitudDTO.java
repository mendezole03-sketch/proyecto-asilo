package com.asilo.notificaciones_service.dto;

public class SolicitudDTO {
    private Long idSolicitud;
    private String nombrePaciente;
    private String nombreFamiliar;
    private String correoFamiliar;
    private String medicoEspecialista;
    private String motivo;

    public SolicitudDTO() {}

    public SolicitudDTO(Long idSolicitud, String nombrePaciente, String nombreFamiliar, String correoFamiliar, String medicoEspecialista, String motivo) {
        this.idSolicitud = idSolicitud;
        this.nombrePaciente = nombrePaciente;
        this.nombreFamiliar = nombreFamiliar;
        this.correoFamiliar = correoFamiliar;
        this.medicoEspecialista = medicoEspecialista;
        this.motivo = motivo;
    }

    public Long getIdSolicitud() { return idSolicitud; }
    public void setIdSolicitud(Long idSolicitud) { this.idSolicitud = idSolicitud; }

    public String getNombrePaciente() { return nombrePaciente; }
    public void setNombrePaciente(String nombrePaciente) { this.nombrePaciente = nombrePaciente; }

    public String getNombreFamiliar() { return nombreFamiliar; }
    public void setNombreFamiliar(String nombreFamiliar) { this.nombreFamiliar = nombreFamiliar; }

    public String getCorreoFamiliar() { return correoFamiliar; }
    public void setCorreoFamiliar(String correoFamiliar) { this.correoFamiliar = correoFamiliar; }

    public String getMedicoEspecialista() { return medicoEspecialista; }
    public void setMedicoEspecialista(String medicoEspecialista) { this.medicoEspecialista = medicoEspecialista; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}