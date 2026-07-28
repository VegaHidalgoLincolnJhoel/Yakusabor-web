package com.yakusabor.backend.dto;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class PedidoItemRequest {
    @JsonProperty("producto_id")
    private Integer productoId;

    private Integer cantidad;

    @JsonProperty("precio_unitario")
    private BigDecimal precioUnitario;

    private String notas;
}
