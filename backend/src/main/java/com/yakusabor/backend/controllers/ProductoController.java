// ProductoController.java
package com.yakusabor.backend.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.yakusabor.backend.models.Producto;
import com.yakusabor.backend.services.ProductoService;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    @Autowired private ProductoService productoService;

    @GetMapping
    public List<Producto> obtenerProductos() {
        return productoService.obtenerProductos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerProducto(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(productoService.obtenerProducto(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> crearProducto(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(productoService.crearProducto(body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editarProducto(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(productoService.editarProducto(id, body));
        } catch (IllegalArgumentException e) {
            return e.getMessage().equals("Producto no encontrado.")
                    ? ResponseEntity.notFound().build()
                    : ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/disponibilidad")
    public ResponseEntity<?> actualizarDisponibilidad(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(productoService.actualizarDisponibilidad(id, body));
        } catch (IllegalArgumentException e) {
            return e.getMessage().equals("Producto no encontrado.")
                    ? ResponseEntity.notFound().build()
                    : ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarProducto(@PathVariable Integer id) {
        try {
            productoService.eliminarProducto(id);
            return ResponseEntity.ok("Producto eliminado.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}