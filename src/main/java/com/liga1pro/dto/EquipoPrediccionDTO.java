package com.liga1pro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipoPrediccionDTO {
    private Long equipoId;
    private String nombre;
    private int probabilidad;
    private int forma;
    private int rendimientoJugadores;
    private int h2h;
    private int partidosAnalizados;
    private List<String> ultimosResultados;
    private List<String> jugadoresClave;
}
