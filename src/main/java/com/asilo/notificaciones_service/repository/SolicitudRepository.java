package com.asilo.notificaciones_service.repository;

import com.asilo.notificaciones_service.model.Solicitud;
import java.util.List;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SolicitudRepository extends JpaRepository<Solicitud, Long> {
    
    // Método que ya tenías
    List<Solicitud> findByIdEnfermero(Long idEnfermero);

    // NUEVO MÉTODO: Valida si el enfermero ya tiene una cita activa con un estado específico (ej. "AGENDADA")
    boolean existsByIdEnfermeroAndFechaCitaAndHorarioEnfermeroAndEstado(
        Integer idEnfermero, 
        LocalDate fechaCita, 
        String horarioEnfermero, 
        String estado
    );
}