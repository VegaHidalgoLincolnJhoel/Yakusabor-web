package com.yakusabor.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ReservaResponse {
    private Integer mesaId;
    private String codigo;
    private String estado;
    private String mensaje;
}
