/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package com.asilo.notificaciones_service.repository;

import com.asilo.notificaciones_service.model.RecetaMedicamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FarmaciaRepository extends JpaRepository<RecetaMedicamento, Long> {
    
    // Agregamos este método para que el FarmaciaController pueda buscar recetas por visita
    List<RecetaMedicamento> findByIdVisita(Long idVisita);
    
}