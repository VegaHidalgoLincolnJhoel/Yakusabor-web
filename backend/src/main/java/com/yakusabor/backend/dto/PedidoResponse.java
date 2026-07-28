package com.yakusabor.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PedidoResponse {
    private Integer id;
    private String tipo;
    private String estado;
    private BigDecimal total;
    private LocalDateTime createdAt;
    private String mensaje;
}
