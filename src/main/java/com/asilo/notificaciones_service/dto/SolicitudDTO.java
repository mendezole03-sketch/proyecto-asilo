package com.asilo.notificaciones_service.dto;

import java.time.LocalDateTime;

public class SolicitudDTO {

    private PacienteIdDTO paciente;
    private UsuarioIdDTO enfermero;
    private String especialidad;
    private String fechaHora;
    private String motivo;

    // Getters y Setters
    public PacienteIdDTO getPaciente() { return paciente; }
    public void setPaciente(PacienteIdDTO paciente) { this.paciente = paciente; }

    public UsuarioIdDTO getEnfermero() { return enfermero; }
    public void setEnfermero(UsuarioIdDTO enfermero) { this.enfermero = enfermero; }

    public String getEspecialidad() { return especialidad; }
    public void setEspecialidad(String especialidad) { this.especialidad = especialidad; }

    public String getFechaHora() { return fechaHora; }
    public void setFechaHora(String fechaHora) { this.fechaHora = fechaHora; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    // Clases internas para mapear los IDs que envía JS { idPaciente: X } y { idUsuario: X }
    public static class PacienteIdDTO {
        private Long idPaciente;
        public Long getIdPaciente() { return idPaciente; }
        public void setIdPaciente(Long idPaciente) { this.idPaciente = idPaciente; }
    }

    public static class UsuarioIdDTO {
        private Long idUsuario;
        public Long getIdUsuario() { return idUsuario; }
        public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
    }
}