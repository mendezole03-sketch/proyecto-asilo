package com.asilo.notificaciones_service.dto;

public class ExamenLaboratorioResponseDTO {
    private Long idExamen;
    private Long idVisita;
    private Long idSolicitud;
    private Integer idPaciente;
    private String nombrePaciente;
    private String nombreExamen;
    private Double costoExamen;
    private String estado;
    private String resultado;

    // --- GETTERS Y SETTERS ---

    public Long getIdExamen() { return idExamen; }
    public void setIdExamen(Long idExamen) { this.idExamen = idExamen; }

    public Long getIdVisita() { return idVisita; }
    public void setIdVisita(Long idVisita) { this.idVisita = idVisita; }

    public Long getIdSolicitud() { return idSolicitud; }
    public void setIdSolicitud(Long idSolicitud) { this.idSolicitud = idSolicitud; }

    public Integer getIdPaciente() { return idPaciente; }
    public void setIdPaciente(Integer idPaciente) { this.idPaciente = idPaciente; }

    public String getNombrePaciente() { return nombrePaciente; }
    public void setNombrePaciente(String nombrePaciente) { this.nombrePaciente = nombrePaciente; }

    public String getNombreExamen() { return nombreExamen; }
    public void setNombreExamen(String nombreExamen) { this.nombreExamen = nombreExamen; }

    public Double getCostoExamen() { return costoExamen; }
    public void setCostoExamen(Double costoExamen) { this.costoExamen = costoExamen; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getResultado() { return resultado; }
    public void setResultado(String resultado) { this.resultado = resultado; }
}