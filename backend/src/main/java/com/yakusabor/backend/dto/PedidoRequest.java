package com.yakusabor.backend.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class PedidoRequest {
    @JsonProperty("tipo_pedido")
    private String tipoPedido;

    @JsonProperty("mesa_id")
    private Integer mesaId;

    @JsonProperty("mesero_id")
    private Integer meseroId;

    private String direccion;

    private List<PedidoItemRequest> items = new ArrayList<>();

    private BigDecimal total;
}
