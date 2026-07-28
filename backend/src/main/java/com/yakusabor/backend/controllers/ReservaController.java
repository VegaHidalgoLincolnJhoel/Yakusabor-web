// ReservaController.java
package com.yakusabor.backend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.yakusabor.backend.dto.ReservaRequest;
import com.yakusabor.backend.services.ReservaService;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    @Autowired private ReservaService reservaService;

    @PostMapping
    public ResponseEntity<?> reservarMesa(@RequestBody ReservaRequest request) {
        try {
            return ResponseEntity.ok(reservaService.reservarMesa(request.getMesaId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}