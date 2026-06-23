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
public class PrediccionPartidoDTO {
    private Long partidoId;
    private String titulo;
    private int probLocal;
    private int probEmpate;
    private int probVisitante;
    private String resumen;
    private EquipoPrediccionDTO local;
    private EquipoPrediccionDTO visitante;
    private List<FactorPrediccionDTO> factores;
}
