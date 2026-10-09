package com.asilo.notificaciones_service.repository;

import com.asilo.notificaciones_service.model.CuentaFamiliar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CuentaFamiliarRepository extends JpaRepository<CuentaFamiliar, Long> {
}