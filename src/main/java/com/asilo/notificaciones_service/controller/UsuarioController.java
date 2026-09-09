package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.model.Usuario;
import com.asilo.notificaciones_service.repository.UsuarioRepository; // Asegúrate de ajustar este import a tu paquete de repositorios
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping
    public List<Usuario> obtenerTodos() {
        return usuarioRepository.findAll();
    }
}