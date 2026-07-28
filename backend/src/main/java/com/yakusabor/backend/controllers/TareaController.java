package com.yakusabor.backend.controllers;

import com.yakusabor.backend.models.Tarea;
import com.yakusabor.backend.models.Usuario;
import com.yakusabor.backend.repositories.TareaRepository;
import com.yakusabor.backend.repositories.UsuarioRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tareas")
public class TareaController {

    private final TareaRepository tareaRepository;
    private final UsuarioRepository usuarioRepository;

    public TareaController(TareaRepository tareaRepository, UsuarioRepository usuarioRepository) {
        this.tareaRepository = tareaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // Admin asigna una tarea a un mozo
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'Administrador', 'administrador')")
    public Tarea asignarTarea(@RequestBody Map<String, Object> body, Authentication auth) {
        Tarea tarea = new Tarea();
        tarea.setMeseroId(Integer.valueOf(body.get("meseroId").toString()));
        tarea.setMensaje(body.get("mensaje").toString());
        tarea.setAsignadoPor(auth.getName()); // email del admin logueado
        return tareaRepository.save(tarea);
    }

    // El mozo ve SUS tareas pendientes
    @GetMapping("/mias")
    public List<Tarea> misTareas(Authentication auth) {
        Usuario usuario = usuarioRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return tareaRepository.findByMeseroIdAndEstadoOrderByCreatedAtDesc(usuario.getId(), "pendiente");
    }

    // El mozo marca una tarea como completada
    @PutMapping("/{id}/completar")
    public Tarea completar(@PathVariable Long id) {
        Tarea tarea = tareaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tarea no encontrada"));
        tarea.setEstado("completada");
        tarea.setCompletedAt(LocalDateTime.now());
        return tareaRepository.save(tarea);
    }

    // Admin ve el historial completo de un mozo (opcional)
    @GetMapping("/mesero/{meseroId}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'Administrador', 'administrador')")
    public List<Tarea> historialMesero(@PathVariable Integer meseroId) {
        return tareaRepository.findByMeseroIdOrderByCreatedAtDesc(meseroId);
    }
}