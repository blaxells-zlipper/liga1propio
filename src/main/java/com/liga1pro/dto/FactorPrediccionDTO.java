package com.liga1pro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FactorPrediccionDTO {
    private String titulo;
    private String detalle;
    private int valor;
}
