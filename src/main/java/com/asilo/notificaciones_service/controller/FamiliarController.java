package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.model.Familiar;
import com.asilo.notificaciones_service.repository.FamiliarRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/familiares")
@CrossOrigin(origins = "*")
public class FamiliarController {

    @Autowired
    private FamiliarRepository familiarRepository;

    @GetMapping
    public ResponseEntity<List<Familiar>> listarFamiliares() {
        List<Familiar> lista = familiarRepository.findAll();
        return ResponseEntity.ok(lista);
    }
}