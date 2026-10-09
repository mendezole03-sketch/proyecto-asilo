package com.asilo.notificaciones_service.repository;

import com.asilo.notificaciones_service.model.Donacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DonacionRepository extends JpaRepository<Donacion, Long> {
}