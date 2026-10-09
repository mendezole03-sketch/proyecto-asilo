package com.asilo.notificaciones_service.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "cuotas_mensuales")
public class CuotaMensual {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cuota")
    private Long idCuota;

    @Column(name = "id_familiar")
    private Long idFamiliar;

    @Column(name = "idPaciente")
    private Long idPaciente;

    @Column(name = "monto", nullable = false)
    private Double monto;

    @Column(name = "mes_correspondiente", nullable = false)
    private String mesCorrespondiente;

    @Column(name = "estado", nullable = false)
    private String estado; // Ejemplo: 'Pendiente', 'Pagado'

    @Column(name = "fecha_pago")
    private LocalDate fechaPago;

    // Relaciones opcionales para mostrar nombres en el frontend si tus entidades ya existen
    @ManyToOne
    @JoinColumn(name = "idPaciente", insertable = false, updatable = false)
    private Paciente paciente;

    @ManyToOne
    @JoinColumn(name = "id_familiar", insertable = false, updatable = false)
    private Familiar familiar;

    // Getters y Setters
    public Long getIdCuota() { return idCuota; }
    public void setIdCuota(Long idCuota) { this.idCuota = idCuota; }

    public Long getIdFamiliar() { return idFamiliar; }
    public void setIdFamiliar(Long idFamiliar) { this.idFamiliar = idFamiliar; }

    public Long getIdPaciente() { return idPaciente; }
    public void setIdPaciente(Long idPaciente) { this.idPaciente = idPaciente; }

    public Double getMonto() { return monto; }
    public void setMonto(Double monto) { this.monto = monto; }

    public String getMesCorrespondiente() { return mesCorrespondiente; }
    public void setMesCorrespondiente(String mesCorrespondiente) { this.mesCorrespondiente = mesCorrespondiente; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public LocalDate getFechaPago() { return fechaPago; }
    public void setFechaPago(LocalDate fechaPago) { this.fechaPago = fechaPago; }

    public Paciente getPaciente() { return paciente; }
    public void setPaciente(Paciente paciente) { this.paciente = paciente; }

    public Familiar getFamiliar() { return familiar; }
    public void setFamiliar(Familiar familiar) { this.familiar = familiar; }
}