package com.yakusabor.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PedidoDashboardResponse {
    private Integer id;
    private String tipo;
    private String estado;
    private BigDecimal total;
    private LocalDateTime createdAt;
    private Integer mesaId;
    private String mesaCodigo;
    private String direccionDelivery;
    private List<PedidoDetalleResponse> detalles;
    private Integer meseroId;
    private String meseroNombre;
    private String turno;
}