package com.asilo.notificaciones_service.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "cuenta_familiar")
public class CuentaFamiliar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cargo")
    private Long idCargo;

    @ManyToOne
    @JoinColumn(name = "idPaciente")
    private Paciente paciente;

    @ManyToOne
    @JoinColumn(name = "id_familiar")
    private Familiar familiar;

    // Atributo agregado para mapear id_visita en la base de datos
    @Column(name = "id_visita")
    private Long idVisita;

    @Column(name = "subtotal_consulta")
    private Double subtotalConsulta;

    @Column(name = "subtotal_examenes")
    private Double subtotalExamenes;

    @Column(name = "subtotal_medicamentos")
    private Double subtotalMedicamentos;

    @Column(name = "monto_total_bruto")
    private Double montoTotalBruto;

    @Column(name = "descuento_fundacion")
    private Double descuentoFundacion;

    @Column(name = "monto_final_a_pagar")
    private Double montoFinalAPagar;

    @Column(name = "estado_pago")
    private String estadoPago;

    @Column(name = "fecha_cargo")
    private LocalDate fechaCargo;

    // Getters y Setters
    public Long getIdCargo() { return idCargo; }
    public void setIdCargo(Long idCargo) { this.idCargo = idCargo; }

    public Paciente getPaciente() { return paciente; }
    public void setPaciente(Paciente paciente) { this.paciente = paciente; }

    public Familiar getFamiliar() { return familiar; }
    public void setFamiliar(Familiar familiar) { this.familiar = familiar; }

    // Getters y Setters para idVisita
    public Long getIdVisita() { return idVisita; }
    public void setIdVisita(Long idVisita) { this.idVisita = idVisita; }

    public Double getSubtotalConsulta() { return subtotalConsulta; }
    public void setSubtotalConsulta(Double subtotalConsulta) { this.subtotalConsulta = subtotalConsulta; }

    public Double getSubtotalExamenes() { return subtotalExamenes; }
    public void setSubtotalExamenes(Double subtotalExamenes) { this.subtotalExamenes = subtotalExamenes; }

    public Double getSubtotalMedicamentos() { return subtotalMedicamentos; }
    public void setSubtotalMedicamentos(Double subtotalMedicamentos) { this.subtotalMedicamentos = subtotalMedicamentos; }

    public Double getMontoTotalBruto() { return montoTotalBruto; }
    public void setMontoTotalBruto(Double montoTotalBruto) { this.montoTotalBruto = montoTotalBruto; }

    public Double getDescuentoFundacion() { return descuentoFundacion; }
    public void setDescuentoFundacion(Double descuentoFundacion) { this.descuentoFundacion = descuentoFundacion; }

    public Double getMontoFinalAPagar() { return montoFinalAPagar; }
    public void setMontoFinalAPagar(Double montoFinalAPagar) { this.montoFinalAPagar = montoFinalAPagar; }

    public String getEstadoPago() { return estadoPago; }
    public void setEstadoPago(String estadoPago) { this.estadoPago = estadoPago; }

    public LocalDate getFechaCargo() { return fechaCargo; }
    public void setFechaCargo(LocalDate fechaCargo) { this.fechaCargo = fechaCargo; }
}