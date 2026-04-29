package com.example.liga1pro.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "partidos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Partido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "equipo_local_id")
    private Equipo equipoLocal;

    @ManyToOne
    @JoinColumn(name = "equipo_visitante_id")
    private Equipo equipoVisitante;

    private LocalDateTime fechaHora;
    private Integer golesLocal;
    private Integer golesVisitante;

    @Enumerated(EnumType.STRING)
    private EstadoPartido estado;

    private String estadio;

    public enum EstadoPartido {
        PROGRAMADO, EN_VIVO, FINALIZADO, SUSPENDIDO
    }
}
