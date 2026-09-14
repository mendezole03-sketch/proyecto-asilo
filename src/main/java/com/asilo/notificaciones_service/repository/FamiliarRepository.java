package com.asilo.notificaciones_service.repository;

import com.asilo.notificaciones_service.model.Familiar;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FamiliarRepository extends JpaRepository<Familiar, Integer> {
    // Cambiamos de Optional<Familiar> a List<Familiar>
    List<Familiar> findByNombreIgnoreCase(String nombre);
}