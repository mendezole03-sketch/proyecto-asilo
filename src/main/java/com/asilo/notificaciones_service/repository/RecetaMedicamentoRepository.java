package com.asilo.notificaciones_service.repository;

import com.asilo.notificaciones_service.model.RecetaMedicamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecetaMedicamentoRepository extends JpaRepository<RecetaMedicamento, Long> {

    // Obtener las recetas/medicamentos de una visita médica
    List<RecetaMedicamento> findByIdVisita(Long idVisita);

    // Obtener recetas por estado (ej. "PENDIENTE_ENTREGA" para la farmacia)
    List<RecetaMedicamento> findByEstado(String estado);
}