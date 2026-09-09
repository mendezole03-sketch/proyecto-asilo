package com.asilo.notificaciones_service.repository;

import com.asilo.notificaciones_service.model.Familiar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface FamiliarRepository extends JpaRepository<Familiar, Integer> {
    // Busca si ya existe un familiar por nombre (ignorando mayúsculas/minúsculas)
    Optional<Familiar> findByNombreIgnoreCase(String nombre);
}
