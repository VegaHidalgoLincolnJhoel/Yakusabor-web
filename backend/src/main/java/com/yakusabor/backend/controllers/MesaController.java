// MesaController.java
package com.yakusabor.backend.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.yakusabor.backend.dto.MesaEstadoResponse;
import com.yakusabor.backend.services.MesaService;
import com.yakusabor.backend.services.PedidoService;

@RestController
@RequestMapping("/api/mesas")
public class MesaController {

    @Autowired private MesaService mesaService;
    @Autowired private PedidoService pedidoService;

    @GetMapping("/{id}/cuenta")
public ResponseEntity<?> obtenerCuenta(@PathVariable Integer id) {
    try {
        return ResponseEntity.ok(pedidoService.obtenerCuentaMesa(id));
    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

    @GetMapping("/estado")
    public List<MesaEstadoResponse> obtenerEstadoMesas() {
        return mesaService.obtenerEstadoMesas();
    }

    @PostMapping
    public ResponseEntity<?> crearMesa(@RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(mesaService.crearMesa(body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstado(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(mesaService.actualizarEstado(id, body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarMesa(@PathVariable Integer id) {
        try {
            mesaService.eliminarMesa(id);
            return ResponseEntity.ok("Mesa eliminada.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}