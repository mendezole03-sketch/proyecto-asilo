package com.asilo.notificaciones_service.repository;

import com.asilo.notificaciones_service.model.VisitaMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VisitaMedicaRepository extends JpaRepository<VisitaMedica, Long> {
    List<VisitaMedica> findByIdPaciente(Integer idPaciente);
    List<VisitaMedica> findByIdMedicoEspecialista(Integer idMedicoEspecialista);
}