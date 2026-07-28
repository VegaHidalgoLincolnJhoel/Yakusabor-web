package com.yakusabor.backend.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PedidoDetalleResponse {
    private Integer productoId;
    private String productoNombre;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private String notas;
    private Integer detalleId;       // <-- NUEVO: ID del detalle para actualizarlo
    private String estadoDetalle;    // <-- NUEVO: estado individual del plato
}