package com.asilo.notificaciones_service.dto;

import java.time.LocalDate;

public class AgendarCitaDTO {

    private Integer idMedicoEspecialista;
    private LocalDate fechaCita;
    private String horaCita;

    public AgendarCitaDTO() {
    }

    public AgendarCitaDTO(Integer idMedicoEspecialista, LocalDate fechaCita, String horaCita) {
        this.idMedicoEspecialista = idMedicoEspecialista;
        this.fechaCita = fechaCita;
        this.horaCita = horaCita;
    }

    public Integer getIdMedicoEspecialista() {
        return idMedicoEspecialista;
    }

    public void setIdMedicoEspecialista(Integer idMedicoEspecialista) {
        this.idMedicoEspecialista = idMedicoEspecialista;
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
}
