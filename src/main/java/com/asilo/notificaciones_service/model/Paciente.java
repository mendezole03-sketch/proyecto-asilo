package com.asilo.notificaciones_service.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "Paciente")
public class Paciente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idPaciente")
    private Integer idPaciente;

    @Column(name = "nombre")
    private String nombre;

    @Column(name = "fechaNacimiento")
    private LocalDate fechaNacimiento;

    @Column(name = "fechaIngreso")
    private LocalDate fechaIngreso;

    @Column(name = "diagnosticoInicial")
    private String diagnosticoInicial;

    @Column(name = "medicamentosCajon")
    private String medicamentosCajon;

    @Column(name = "psicopatologias")
    private String psicopatologias;

    @Column(name = "nombreFamiliar")
    private String nombreFamiliar;

    // Relación ManyToOne con la entidad Usuario (id_medico en SQL Server)
    @ManyToOne
    @JoinColumn(name = "id_medico")
    private Usuario medico;

    // Constructor vacío (Requerido por JPA)
    public Paciente() {
    }

    // Constructor completo
    public Paciente(String nombre, LocalDate fechaNacimiento, LocalDate fechaIngreso, 
                    String diagnosticoInicial, String medicamentosCajon, 
                    String psicopatologias, String nombreFamiliar, Usuario medico) {
        this.nombre = nombre;
        this.fechaNacimiento = fechaNacimiento;
        this.fechaIngreso = fechaIngreso;
        this.diagnosticoInicial = diagnosticoInicial;
        this.medicamentosCajon = medicamentosCajon;
        this.psicopatologias = psicopatologias;
        this.nombreFamiliar = nombreFamiliar;
        this.medico = medico;
    }

    // Getters y Setters
    public Integer getIdPaciente() {
        return idPaciente;
    }

    public void setIdPaciente(Integer idPaciente) {
        this.idPaciente = idPaciente;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public LocalDate getFechaNacimiento() {
        return fechaNacimiento;
    }

    public void setFechaNacimiento(LocalDate fechaNacimiento) {
        this.fechaNacimiento = fechaNacimiento;
    }

    public LocalDate getFechaIngreso() {
        return fechaIngreso;
    }

    public void setFechaIngreso(LocalDate fechaIngreso) {
        this.fechaIngreso = fechaIngreso;
    }

    public String getDiagnosticoInicial() {
        return diagnosticoInicial;
    }

    public void setDiagnosticoInicial(String diagnosticoInicial) {
        this.diagnosticoInicial = diagnosticoInicial;
    }

    public String getMedicamentosCajon() {
        return medicamentosCajon;
    }

    public void setMedicamentosCajon(String medicamentosCajon) {
        this.medicamentosCajon = medicamentosCajon;
    }

    public String getPsicopatologias() {
        return psicopatologias;
    }

    public void setPsicopatologias(String psicopatologias) {
        this.psicopatologias = psicopatologias;
    }

    public String getNombreFamiliar() {
        return nombreFamiliar;
    }

    public void setNombreFamiliar(String nombreFamiliar) {
        this.nombreFamiliar = nombreFamiliar;
    }

    public Usuario getMedico() {
        return medico;
    }

    public void setMedico(Usuario medico) {
        this.medico = medico;
    }
}