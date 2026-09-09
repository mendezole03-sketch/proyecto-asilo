package com.asilo.notificaciones_service.model;

import jakarta.persistence.*;

@Entity
@Table(name = "Familiar")
public class Familiar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idFamiliar")
    private Integer idFamiliar;

    @Column(name = "nombre")
    private String nombre;

    @Column(name = "telefono")
    private String telefono;

    @Column(name = "correo")
    private String correo;

    @Column(name = "direccion")
    private String direccion;

    public Familiar() {}

    public Familiar(String nombre, String telefono, String correo, String direccion) {
        this.nombre = nombre;
        this.telefono = telefono;
        this.correo = correo;
        this.direccion = direccion;
    }

    // Getters y Setters
    public Integer getIdFamiliar() { return idFamiliar; }
    public void setIdFamiliar(Integer idFamiliar) { this.idFamiliar = idFamiliar; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
}