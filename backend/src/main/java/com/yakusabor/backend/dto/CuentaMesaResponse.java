package com.yakusabor.backend.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CuentaMesaResponse {
    private Integer mesaId;
    private String mesaCodigo;
    private BigDecimal total;
    private List<PedidoDashboardResponse> pedidos;
}