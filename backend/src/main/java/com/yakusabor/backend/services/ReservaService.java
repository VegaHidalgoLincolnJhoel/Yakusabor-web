// ReservaService.java
package com.yakusabor.backend.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.yakusabor.backend.dto.ReservaResponse;
import com.yakusabor.backend.models.Mesa;
import com.yakusabor.backend.repositories.MesaRepository;

@Service
public class ReservaService {

    @Autowired private MesaRepository mesaRepository;

    public ReservaResponse reservarMesa(Integer mesaId) {
        if (mesaId == null) {
            throw new IllegalArgumentException("Debes seleccionar una mesa.");
        }

        Mesa mesa = mesaRepository.findById(mesaId)
                .orElseThrow(() -> new IllegalArgumentException("La mesa seleccionada no existe."));

        if (!"libre".equalsIgnoreCase(mesa.getEstado())) {
            throw new IllegalArgumentException("La mesa " + mesa.getCodigo() + " no está disponible.");
        }

        mesa.setEstado("reservada");
        Mesa guardada = mesaRepository.save(mesa);

        return new ReservaResponse(guardada.getId(), guardada.getCodigo(), guardada.getEstado(),
                "Reserva confirmada correctamente.");
    }
}