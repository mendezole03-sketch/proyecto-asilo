package com.asilo.notificaciones_service.repository;

import com.asilo.notificaciones_service.model.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Integer> {
    
    // Spring Data JPA genera automáticamente la consulta: WHERE activo = true
    List<Paciente> findByActivoTrue();
}