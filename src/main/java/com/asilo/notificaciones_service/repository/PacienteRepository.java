package com.asilo.notificaciones_service.repository;

import com.asilo.notificaciones_service.model.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Integer> {
    // Al extender de JpaRepository obtienes automáticamente métodos como:
    // .save(paciente)       -> Insertar / Actualizar
    // .findAll()            -> Listar todos
    // .findById(id)         -> Buscar por ID
    // .deleteById(id)       -> Eliminar por ID
}
