// UsuarioController.java
package com.yakusabor.backend.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.yakusabor.backend.services.UsuarioService;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired private UsuarioService usuarioService;

    @GetMapping("/meseros")
    public ResponseEntity<?> listarMeseros() {
        try {
            return ResponseEntity.ok(usuarioService.listarMeseros());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al listar meseros: " + e.getMessage());
        }
    }

    @PostMapping("/meseros")
    public ResponseEntity<?> crearMesero(@RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.crearMesero(body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al crear mesero: " + e.getMessage());
        }
    }

    @DeleteMapping("/meseros/{id}")
    public ResponseEntity<?> eliminarMesero(@PathVariable Integer id) {
        try {
            usuarioService.eliminarMesero(id);
            return ResponseEntity.ok("Mesero eliminado correctamente.");
        } catch (IllegalArgumentException e) {
            return e.getMessage().equals("Usuario no encontrado.")
                    ? ResponseEntity.notFound().build()
                    : ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al eliminar mesero: " + e.getMessage());
        }
    }

    @PutMapping("/meseros/{id}/activo")
    public ResponseEntity<?> toggleActivo(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            Boolean activo = body.get("activo") != null ? Boolean.parseBoolean(String.valueOf(body.get("activo"))) : null;
            var u = usuarioService.toggleActivo(id, activo);
            return ResponseEntity.ok(Map.of("id", id, "activo", u.getActivo()));
        } catch (IllegalArgumentException e) {
            return e.getMessage().equals("Usuario no encontrado.")
                    ? ResponseEntity.notFound().build()
                    : ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }
}