package com.asilo.notificaciones_service.repository;

import com.asilo.notificaciones_service.model.AgendaEnfermeria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional; // <-- 1. Importar Optional

public interface AgendaEnfermeriaRepository extends JpaRepository<AgendaEnfermeria, Long> {
    // Permite buscar todos los turnos asignados a un enfermero específico por su ID
    List<AgendaEnfermeria> findByIdEnfermero(Long idEnfermero);

    // 2. Método para buscar un registro en la agenda utilizando el ID de la solicitud
    Optional<AgendaEnfermeria> findByIdSolicitud(Long idSolicitud);
}