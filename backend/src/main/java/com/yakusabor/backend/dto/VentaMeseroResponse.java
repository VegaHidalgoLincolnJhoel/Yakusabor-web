package com.yakusabor.backend.dto;

public record VentaMeseroResponse(
        Integer meseroId,
        String meseroNombre,
        String turno,
        Long numVentas) {
}
