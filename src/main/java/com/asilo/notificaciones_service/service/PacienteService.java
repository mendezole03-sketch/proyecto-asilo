package com.asilo.notificaciones_service.service;

import com.asilo.notificaciones_service.model.Paciente;
import com.asilo.notificaciones_service.repository.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PacienteService {

    @Autowired
    private PacienteRepository pacienteRepository;

    // Obtener únicamente los pacientes activos
    public List<Paciente> obtenerTodos() {
        return pacienteRepository.findByActivoTrue(); 
    }

    public Optional<Paciente> obtenerPorId(Integer id) {
        return pacienteRepository.findById(id);
    }

    public Paciente guardar(Paciente paciente) {
        return pacienteRepository.save(paciente);
    }

    // Método para Borrado Lógico en lugar de eliminación física
    public boolean eliminar(Integer id) {
        Optional<Paciente> pacienteOpt = pacienteRepository.findById(id);
        if (pacienteOpt.isPresent()) {
            Paciente paciente = pacienteOpt.get();
            paciente.setActivo(false); // Cambia el estado a inactivo
            pacienteRepository.save(paciente);
            return true;
        }
        return false;
    }
}