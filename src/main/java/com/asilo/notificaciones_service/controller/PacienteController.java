package com.asilo.notificaciones_service.controller;

import com.asilo.notificaciones_service.model.Familiar;
import com.asilo.notificaciones_service.model.Paciente;
import com.asilo.notificaciones_service.model.Usuario;
import com.asilo.notificaciones_service.repository.FamiliarRepository;
import com.asilo.notificaciones_service.repository.PacienteRepository;
import com.asilo.notificaciones_service.repository.UsuarioRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/pacientes")
@CrossOrigin(origins = "*")
public class PacienteController {

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private FamiliarRepository familiarRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping
    public List<Paciente> obtenerTodos() {
        return pacienteRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> guardarPaciente(@Valid @RequestBody Paciente paciente) {
        try {
            // Validaciones de fechas
            ResponseEntity<?> validacionFechas = validarFechas(paciente);
            if (validacionFechas != null) {
                return validacionFechas;
            }

            // Asignar Médico
            if (paciente.getMedico() != null && paciente.getMedico().getIdUsuario() != null) {
                Optional<Usuario> medicoOpt = usuarioRepository.findById(paciente.getMedico().getIdUsuario());
                if (medicoOpt.isPresent()) {
                    paciente.setMedico(medicoOpt.get());
                } else {
                    return ResponseEntity.badRequest().body("El médico seleccionado no existe.");
                }
            } else {
                paciente.setMedico(null);
            }

            // Asignar y guardar Familiar
            procesarFamiliar(paciente);

            Paciente pacienteGuardado = pacienteRepository.save(paciente);
            return ResponseEntity.ok(pacienteGuardado);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error interno al guardar: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarPaciente(@PathVariable Integer id, @Valid @RequestBody Paciente pacienteDetalles) {
        try {
            Optional<Paciente> pacienteOptional = pacienteRepository.findById(id);

            if (pacienteOptional.isPresent()) {
                Paciente pacienteExistente = pacienteOptional.get();

                // Validaciones de fechas
                ResponseEntity<?> validacionFechas = validarFechas(pacienteDetalles);
                if (validacionFechas != null) {
                    return validacionFechas;
                }

                // Actualizar campos simples
                pacienteExistente.setNombre(pacienteDetalles.getNombre());
                pacienteExistente.setFechaNacimiento(pacienteDetalles.getFechaNacimiento());
                pacienteExistente.setFechaIngreso(pacienteDetalles.getFechaIngreso());
                pacienteExistente.setDiagnosticoInicial(pacienteDetalles.getDiagnosticoInicial());
                pacienteExistente.setMotivoReclusion(pacienteDetalles.getMotivoReclusion());
                pacienteExistente.setPsicopatologias(pacienteDetalles.getPsicopatologias());
                pacienteExistente.setMedicamentosCajon(pacienteDetalles.getMedicamentosCajon());

                // Actualizar Médico
                if (pacienteDetalles.getMedico() != null && pacienteDetalles.getMedico().getIdUsuario() != null) {
                    Optional<Usuario> medicoOpt = usuarioRepository.findById(pacienteDetalles.getMedico().getIdUsuario());
                    if (medicoOpt.isPresent()) {
                        pacienteExistente.setMedico(medicoOpt.get());
                    }
                } else {
                    pacienteExistente.setMedico(null);
                }

                // Actualizar Familiar
                if (pacienteDetalles.getFamiliar() != null) {
                    procesarFamiliar(pacienteDetalles);
                    pacienteExistente.setFamiliar(pacienteDetalles.getFamiliar());
                } else {
                    pacienteExistente.setFamiliar(null);
                }

                Paciente pacienteActualizado = pacienteRepository.save(pacienteExistente);
                return ResponseEntity.ok(pacienteActualizado);
            }

            return ResponseEntity.notFound().build();

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error interno al actualizar: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarPaciente(@PathVariable Integer id) {
        Optional<Paciente> pacienteOptional = pacienteRepository.findById(id);

        if (pacienteOptional.isPresent()) {
            pacienteRepository.delete(pacienteOptional.get());
            return ResponseEntity.ok().build();
        }

        return ResponseEntity.notFound().build();
    }

    // --- MÉTODOS AUXILIARES ---

    private ResponseEntity<?> validarFechas(Paciente paciente) {
        if (paciente.getFechaNacimiento() != null) {
            int anioNacimiento = paciente.getFechaNacimiento().getYear();
            LocalDate fechaLimiteEdad = LocalDate.now().minusYears(60);

            if (anioNacimiento < 1900) {
                return ResponseEntity.badRequest()
                        .body("La fecha de nacimiento no puede ser anterior al año 1900.");
            }

            if (paciente.getFechaNacimiento().isAfter(fechaLimiteEdad)) {
                return ResponseEntity.badRequest()
                        .body("El paciente debe tener al menos 60 años cumplidos para ingresar al asilo.");
            }
        }

        if (paciente.getFechaIngreso() != null && paciente.getFechaIngreso().isAfter(LocalDate.now())) {
            return ResponseEntity.badRequest()
                    .body("La fecha de ingreso no puede ser una fecha futura.");
        }

        return null;
    }

    private void procesarFamiliar(Paciente paciente) {
        if (paciente.getFamiliar() != null && paciente.getFamiliar().getNombre() != null) {
            String nombreFamiliar = paciente.getFamiliar().getNombre().trim();
            if (nombreFamiliar.isEmpty()) {
                paciente.setFamiliar(null);
                return;
            }

            // Maneja múltiples coincidencias para evitar excepciones
            List<Familiar> familiaresEncontrados = familiarRepository.findByNombreIgnoreCase(nombreFamiliar);

            if (!familiaresEncontrados.isEmpty()) {
                // Selecciona el primer familiar encontrado
                Familiar familiar = familiaresEncontrados.get(0);
                familiar.setTelefono(paciente.getFamiliar().getTelefono());
                familiar.setCorreo(paciente.getFamiliar().getCorreo());
                familiar.setDireccion(paciente.getFamiliar().getDireccion());

                Familiar familiarActualizado = familiarRepository.save(familiar);
                paciente.setFamiliar(familiarActualizado);
            } else {
                // Si no existe, crea uno nuevo sin conservar IDs ambiguos
                Familiar nuevoFamiliar = new Familiar();
                nuevoFamiliar.setNombre(nombreFamiliar);
                nuevoFamiliar.setTelefono(paciente.getFamiliar().getTelefono());
                nuevoFamiliar.setCorreo(paciente.getFamiliar().getCorreo());
                nuevoFamiliar.setDireccion(paciente.getFamiliar().getDireccion());

                Familiar familiarGuardado = familiarRepository.save(nuevoFamiliar);
                paciente.setFamiliar(familiarGuardado);
            }
        }
    }
}