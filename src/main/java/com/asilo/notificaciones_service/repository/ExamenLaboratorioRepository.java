package com.asilo.notificaciones_service.repository;

import com.asilo.notificaciones_service.model.ExamenLaboratorio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamenLaboratorioRepository extends JpaRepository<ExamenLaboratorio, Long> {

    // Obtener los exámenes asociados a una visita médica específica
    List<ExamenLaboratorio> findByIdVisita(Long idVisita);

    // Obtener exámenes por estado (ej. "ORDENADO" para que el laboratorio los procese)
    List<ExamenLaboratorio> findByEstado(String estado);
}