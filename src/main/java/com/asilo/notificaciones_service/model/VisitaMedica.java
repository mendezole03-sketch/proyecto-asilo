package com.asilo.notificaciones_service.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    // --- RELACIONES CON JOINCOLUMN (SIN ERRORES DE COMPILACIÓN) ---

    // Relación con Recetas / Medicamentos de esta visita
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "id_visita")
    private List<RecetaMedicamento> medicamentos = new ArrayList<>();

    // Relación con Exámenes de Laboratorio ordenados en esta visita
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "id_visita")
    private List<ExamenLaboratorio> examenes = new ArrayList<>();

    // --- CONSTRUCTORES ---

    public VisitaMedica() {
    }

    public VisitaMedica(Long idSolicitud, Integer idPaciente, Integer idMedicoEspecialista, String diagnostico, String observaciones, Double costoConsulta) {
        this.idSolicitud = idSolicitud;
        this.idPaciente = idPaciente;
        this.idMedicoEspecialista = idMedicoEspecialista;
        this.diagnostico = diagnostico;
        this.observaciones = observaciones;
        this.costoConsulta = costoConsulta;
    }

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

    public List<RecetaMedicamento> getMedicamentos() {
        return medicamentos;
    }

    public void setMedicamentos(List<RecetaMedicamento> medicamentos) {
        this.medicamentos = medicamentos;
    }

    public List<ExamenLaboratorio> getExamenes() {
        return examenes;
    }

    public void setExamenes(List<ExamenLaboratorio> examenes) {
        this.examenes = examenes;
    }
}