package com.asilo.notificaciones_service.repository;

import com.asilo.notificaciones_service.model.CuotaMensual;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CuotaMensualRepository extends JpaRepository<CuotaMensual, Long> {
}