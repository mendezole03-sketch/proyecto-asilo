package com.asilo.notificaciones_service.model;

import jakarta.persistence.*;
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

    @Column(name = "motivo_reclusion")
    private String motivoReclusion;

    @Column(name = "medicamentosCajon")
    private String medicamentosCajon;

    @Column(name = "psicopatologias")
    private String psicopatologias;

    // Relación con Familiar (CascadeType.ALL guarda automáticamente al familiar al guardar el paciente)
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "id_familiar")
    private Familiar familiar;

    // Relación con Usuario (Médico)
    @ManyToOne
    @JoinColumn(name = "id_medico")
    private Usuario medico;

    public Paciente() {}

    // Getters y Setters
    public Integer getIdPaciente() { return idPaciente; }
    public void setIdPaciente(Integer idPaciente) { this.idPaciente = idPaciente; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public LocalDate getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(LocalDate fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }

    public LocalDate getFechaIngreso() { return fechaIngreso; }
    public void setFechaIngreso(LocalDate fechaIngreso) { this.fechaIngreso = fechaIngreso; }

    public String getDiagnosticoInicial() { return diagnosticoInicial; }
    public void setDiagnosticoInicial(String diagnosticoInicial) { this.diagnosticoInicial = diagnosticoInicial; }

    public String getMotivoReclusion() { return motivoReclusion; }
    public void setMotivoReclusion(String motivoReclusion) { this.motivoReclusion = motivoReclusion; }

    public String getMedicamentosCajon() { return medicamentosCajon; }
    public void setMedicamentosCajon(String medicamentosCajon) { this.medicamentosCajon = medicamentosCajon; }

    public String getPsicopatologias() { return psicopatologias; }
    public void setPsicopatologias(String psicopatologias) { this.psicopatologias = psicopatologias; }

    public Familiar getFamiliar() { return familiar; }
    public void setFamiliar(Familiar familiar) { this.familiar = familiar; }

    public Usuario getMedico() { return medico; }
    public void setMedico(Usuario medico) { this.medico = medico; }
}