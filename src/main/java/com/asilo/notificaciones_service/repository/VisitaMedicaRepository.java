package com.asilo.notificaciones_service.repository;

import com.asilo.notificaciones_service.model.VisitaMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VisitaMedicaRepository extends JpaRepository<VisitaMedica, Long> {
    
    // Obtener el historial completo de visitas médicas de un paciente
    List<VisitaMedica> findByIdPaciente(Integer idPaciente);

    // Obtener las visitas atendidas por un especialista en específico
    List<VisitaMedica> findByIdMedicoEspecialista(Integer idMedicoEspecialista);

    // Obtener las visitas que tienen estado de pago pendiente para la caja/fundación
    List<VisitaMedica> findByEstadoPago(String estadoPago);
}