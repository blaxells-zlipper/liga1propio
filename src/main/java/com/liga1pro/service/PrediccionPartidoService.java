package com.liga1pro.service;

import com.liga1pro.dto.EquipoPrediccionDTO;
import com.liga1pro.dto.FactorPrediccionDTO;
import com.liga1pro.dto.PrediccionPartidoDTO;
import com.liga1pro.model.EstadisticaJugador;
import com.liga1pro.model.EstadoPartido;
import com.liga1pro.model.Jugador;
import com.liga1pro.model.Partido;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PrediccionPartidoService {

    private static final int MAX_PARTIDOS = 10;
    private static final int MAX_H2H = 3;

    private final ApiFootballService apiFootballService;
    private final Map<Long, PrediccionPartidoDTO> cache = new ConcurrentHashMap<>();

    public PrediccionPartidoDTO predecir(Long partidoId) {
        return cache.computeIfAbsent(partidoId, this::calcularPrediccion);
    }

    private PrediccionPartidoDTO calcularPrediccion(Long partidoId) {
        Partido partido = apiFootballService.buscarPartidoPorId(partidoId);
        List<Partido> todosLosPartidos = apiFootballService.listarPartidos();
        LocalDateTime corte = toDateTime(partido);

        Long localId = partido.getEquipoLocal().getId();
        Long visitanteId = partido.getEquipoVisitante().getId();

        List<Partido> localRecientes = ultimosPartidosDeEquipo(todosLosPartidos, localId, corte, MAX_PARTIDOS);
        List<Partido> visitanteRecientes = ultimosPartidosDeEquipo(todosLosPartidos, visitanteId, corte, MAX_PARTIDOS);
        List<Partido> enfrentamientosDirectos = enfrentamientosDirectos(todosLosPartidos, localId, visitanteId, corte, MAX_H2H);

        TeamSnapshot local = analizarEquipo(localId, partido.getEquipoLocal().getNombre(), localRecientes, enfrentamientosDirectos);
        TeamSnapshot visitante = analizarEquipo(visitanteId, partido.getEquipoVisitante().getNombre(), visitanteRecientes, enfrentamientosDirectos);

        int[] probabilidades = calcularProbabilidades(local, visitante, localRecientes, visitanteRecientes, enfrentamientosDirectos, localId, visitanteId);

        return PrediccionPartidoDTO.builder()
                .partidoId(partido.getId())
                .titulo(partido.getEquipoLocal().getNombre() + " vs " + partido.getEquipoVisitante().getNombre())
                .probLocal(probabilidades[0])
                .probEmpate(probabilidades[1])
                .probVisitante(probabilidades[2])
                .resumen(buildResumen(local, visitante, probabilidades[0], probabilidades[1], probabilidades[2]))
                .local(buildEquipoDTO(local, probabilidades[0]))
                .visitante(buildEquipoDTO(visitante, probabilidades[2]))
                .factores(buildFactores(local, visitante, enfrentamientosDirectos, partido))
                .build();
    }

    public void limpiarCache() {
        cache.clear();
    }

    private int[] calcularProbabilidades(
            TeamSnapshot local,
            TeamSnapshot visitante,
            List<Partido> localRecientes,
            List<Partido> visitanteRecientes,
            List<Partido> enfrentamientosDirectos,
            Long localId,
            Long visitanteId
    ) {
        if (local.partidosAnalizados == 0 && visitante.partidosAnalizados == 0) {
            return new int[]{33, 34, 33};
        }

        double localStrength = scoreEquipo(local, true);
        double visitanteStrength = scoreEquipo(visitante, false);
        double closeness = 1.0 - Math.min(1.0, Math.abs(localStrength - visitanteStrength));
        double drawHistory = drawHistory(localRecientes, visitanteRecientes, enfrentamientosDirectos, localId, visitanteId);
        double drawStrength = 0.18 + (drawHistory * 0.42) + (closeness * 0.18);

        double total = localStrength + visitanteStrength + drawStrength;
        if (total <= 0) {
            return new int[]{33, 34, 33};
        }

        int localProb = (int) Math.round((localStrength / total) * 100.0);
        int empateProb = (int) Math.round((drawStrength / total) * 100.0);
        int visitanteProb = Math.max(0, 100 - localProb - empateProb);
        return normalizeProbabilities(localProb, empateProb, visitanteProb);
    }

    private TeamSnapshot analizarEquipo(Long equipoId, String nombre, List<Partido> recientes, List<Partido> h2h) {
        Map<Long, PlayerAccumulator> jugadores = new LinkedHashMap<>();
        List<String> resultados = new ArrayList<>();
        int puntos = 0;
        int h2hPuntos = 0;

        for (Partido partido : recientes) {
            MatchOutcome outcome = outcomeForTeam(partido, equipoId);
            puntos += outcome.puntos();
            resultados.add(formatResultado(partido, equipoId, outcome));
            registrarJugadores(jugadores, partido, equipoId);
        }

        for (Partido partido : h2h) {
            h2hPuntos += outcomeForTeam(partido, equipoId).puntos();
        }

        List<String> jugadoresClave = jugadores.values().stream()
                .map(PlayerAccumulator::toPlayerScore)
                .sorted(Comparator.comparingDouble(PlayerScore::score).reversed())
                .limit(3)
                .map(PlayerScore::label)
                .toList();

        int forma = normalizeFromScale(formaDesdePuntos(puntos, recientes.size()));
        int rendimiento = normalizeFromScale((int) Math.round(promedioScore(jugadores) * 10.0));
        int h2hScore = normalizeFromScale(formaDesdePuntos(h2hPuntos, h2h.size()));

        return new TeamSnapshot(equipoId, nombre, forma, rendimiento, h2hScore, recientes.size(), resultados, jugadoresClave);
    }

    private void registrarJugadores(Map<Long, PlayerAccumulator> acumuladores, Partido partido, Long equipoId) {
        try {
            List<EstadisticaJugador> stats = apiFootballService.obtenerEstadisticasPartido(partido.getId());
            for (EstadisticaJugador estadistica : stats) {
                Jugador jugador = estadistica.getJugador();
                if (jugador == null || jugador.getEquipo() == null || !equipoId.equals(jugador.getEquipo().getId())) {
                    continue;
                }
                acumuladores.computeIfAbsent(jugador.getId(), id -> new PlayerAccumulator(jugador)).add(estadistica);
            }
        } catch (Exception ignored) {
        }
    }

    private List<Partido> ultimosPartidosDeEquipo(List<Partido> todos, Long equipoId, LocalDateTime corte, int limite) {
        return todos.stream()
                .filter(partido -> partido.getEstado() == EstadoPartido.FINALIZADO)
                .filter(partido -> isBefore(partido, corte))
                .filter(partido -> juegaEquipo(partido, equipoId))
                .sorted(Comparator.comparing(this::toDateTime).reversed())
                .limit(limite)
                .toList();
    }

    private List<Partido> enfrentamientosDirectos(List<Partido> todos, Long localId, Long visitanteId, LocalDateTime corte, int limite) {
        return todos.stream()
                .filter(partido -> partido.getEstado() == EstadoPartido.FINALIZADO)
                .filter(partido -> isBefore(partido, corte))
                .filter(partido -> esEntre(partido, localId, visitanteId))
                .sorted(Comparator.comparing(this::toDateTime).reversed())
                .limit(limite)
                .toList();
    }

    private double scoreEquipo(TeamSnapshot equipo, boolean localDelPartido) {
        double forma = equipo.forma / 100.0;
        double rendimiento = equipo.rendimientoJugadores / 100.0;
        double h2h = equipo.h2h / 100.0;
        double localBonus = localDelPartido ? 0.08 : 0.0;
        return (forma * 0.42) + (rendimiento * 0.38) + (h2h * 0.12) + localBonus + 0.08;
    }

    private double drawHistory(List<Partido> localRecientes, List<Partido> visitanteRecientes, List<Partido> h2h, Long localId, Long visitanteId) {
        int drawsLocal = (int) localRecientes.stream().filter(p -> outcomeForTeam(p, localId).esEmpate()).count();
        int drawsVisitante = (int) visitanteRecientes.stream().filter(p -> outcomeForTeam(p, visitanteId).esEmpate()).count();
        int drawsH2H = (int) h2h.stream()
                .filter(p -> p.getGolesLocal() != null && p.getGolesVisitante() != null && p.getGolesLocal().intValue() == p.getGolesVisitante().intValue())
                .count();
        double total = Math.max(1, localRecientes.size() + visitanteRecientes.size() + h2h.size());
        return (drawsLocal + drawsVisitante + drawsH2H) / total;
    }

    private List<FactorPrediccionDTO> buildFactores(TeamSnapshot local, TeamSnapshot visitante, List<Partido> h2h, Partido partido) {
        List<FactorPrediccionDTO> factores = new ArrayList<>();
        factores.add(FactorPrediccionDTO.builder()
                .titulo("Ultimos 10 partidos")
                .detalle(local.nombre + " " + local.forma + "% vs " + visitante.nombre + " " + visitante.forma + "%")
                .valor(Math.abs(local.forma - visitante.forma))
                .build());
        factores.add(FactorPrediccionDTO.builder()
                .titulo("Rendimiento de jugadores")
                .detalle(local.nombre + " " + local.rendimientoJugadores + "% vs " + visitante.nombre + " " + visitante.rendimientoJugadores + "%")
                .valor(Math.abs(local.rendimientoJugadores - visitante.rendimientoJugadores))
                .build());
        factores.add(FactorPrediccionDTO.builder()
                .titulo("Ultimos 3 enfrentamientos")
                .detalle(describirH2H(h2h))
                .valor(h2h.size())
                .build());
        factores.add(FactorPrediccionDTO.builder()
                .titulo("Ventaja de local")
                .detalle(partido.getEquipoLocal().getNombre() + " juega en casa")
                .valor(100)
                .build());
        return factores;
    }

    private String buildResumen(TeamSnapshot local, TeamSnapshot visitante, int probLocal, int probEmpate, int probVisitante) {
        String favorito = probLocal >= probVisitante ? local.nombre : visitante.nombre;
        String rival = probLocal >= probVisitante ? visitante.nombre : local.nombre;
        int favoritoProb = Math.max(probLocal, probVisitante);
        int rivalProb = Math.min(probLocal, probVisitante);
        return String.format(Locale.ROOT,
                "%s llega con ventaja en la lectura previa (%d%%). El peso de sus ultimos partidos, sus jugadores mas influyentes y el historial directo inclinan el analisis, aunque %s todavia conserva opciones reales con %d%%.",
                favorito,
                favoritoProb,
                rival,
                rivalProb);
    }

    private EquipoPrediccionDTO buildEquipoDTO(TeamSnapshot snapshot, int probabilidad) {
        return EquipoPrediccionDTO.builder()
                .equipoId(snapshot.equipoId)
                .nombre(snapshot.nombre)
                .probabilidad(probabilidad)
                .forma(snapshot.forma)
                .rendimientoJugadores(snapshot.rendimientoJugadores)
                .h2h(snapshot.h2h)
                .partidosAnalizados(snapshot.partidosAnalizados)
                .ultimosResultados(snapshot.ultimosResultados)
                .jugadoresClave(snapshot.jugadoresClave)
                .build();
    }

    private String describirH2H(List<Partido> h2h) {
        if (h2h.isEmpty()) {
            return "Sin enfrentamientos recientes suficientes para comparar.";
        }

        int locales = 0;
        int visitantes = 0;
        int empates = 0;

        for (Partido partido : h2h) {
            if (partido.getGolesLocal() == null || partido.getGolesVisitante() == null) {
                continue;
            }
            if (partido.getGolesLocal().equals(partido.getGolesVisitante())) {
                empates++;
            } else if (partido.getGolesLocal() > partido.getGolesVisitante()) {
                locales++;
            } else {
                visitantes++;
            }
        }

        return locales + " victorias del local, " + visitantes + " del visitante y " + empates + " empates en los ultimos cruces.";
    }

    private String formatResultado(Partido partido, Long equipoId, MatchOutcome outcome) {
        String marca = outcome.esVictoria() ? "V" : outcome.esEmpate() ? "E" : "D";
        Integer gf = golesForTeam(partido, equipoId);
        Integer gc = goalsAgainstTeam(partido, equipoId);
        return marca + " " + (gf == null ? "-" : gf) + "-" + (gc == null ? "-" : gc);
    }

    private MatchOutcome outcomeForTeam(Partido partido, Long equipoId) {
        Integer gf = golesForTeam(partido, equipoId);
        Integer gc = goalsAgainstTeam(partido, equipoId);
        if (gf == null || gc == null) {
            return MatchOutcome.sinDatos();
        }
        if (gf > gc) {
            return MatchOutcome.victoria();
        }
        if (gf.equals(gc)) {
            return MatchOutcome.empate();
        }
        return MatchOutcome.derrota();
    }

    private Integer golesForTeam(Partido partido, Long equipoId) {
        if (partido.getEquipoLocal() != null && equipoId.equals(partido.getEquipoLocal().getId())) {
            return partido.getGolesLocal();
        }
        if (partido.getEquipoVisitante() != null && equipoId.equals(partido.getEquipoVisitante().getId())) {
            return partido.getGolesVisitante();
        }
        return null;
    }

    private Integer goalsAgainstTeam(Partido partido, Long equipoId) {
        if (partido.getEquipoLocal() != null && equipoId.equals(partido.getEquipoLocal().getId())) {
            return partido.getGolesVisitante();
        }
        if (partido.getEquipoVisitante() != null && equipoId.equals(partido.getEquipoVisitante().getId())) {
            return partido.getGolesLocal();
        }
        return null;
    }

    private boolean juegaEquipo(Partido partido, Long equipoId) {
        return partido.getEquipoLocal() != null && equipoId.equals(partido.getEquipoLocal().getId())
                || partido.getEquipoVisitante() != null && equipoId.equals(partido.getEquipoVisitante().getId());
    }

    private boolean esEntre(Partido partido, Long equipo1, Long equipo2) {
        if (partido.getEquipoLocal() == null || partido.getEquipoVisitante() == null) {
            return false;
        }
        Long local = partido.getEquipoLocal().getId();
        Long visitante = partido.getEquipoVisitante().getId();
        return (equipo1.equals(local) && equipo2.equals(visitante)) || (equipo2.equals(local) && equipo1.equals(visitante));
    }

    private boolean isBefore(Partido partido, LocalDateTime corte) {
        return toDateTime(partido).isBefore(corte);
    }

    private LocalDateTime toDateTime(Partido partido) {
        return partido.getFecha() == null
                ? LocalDateTime.MIN
                : LocalDateTime.of(partido.getFecha(), partido.getHora() != null ? partido.getHora() : LocalTime.MIDNIGHT);
    }

    private int formaDesdePuntos(int puntos, int partidos) {
        if (partidos <= 0) {
            return 0;
        }
        return (int) Math.round((puntos / (double) (partidos * 3)) * 100.0);
    }

    private double promedioScore(Map<Long, PlayerAccumulator> acumuladores) {
        if (acumuladores.isEmpty()) {
            return 0;
        }
        double total = acumuladores.values().stream()
                .mapToDouble(PlayerAccumulator::averageScore)
                .sum();
        return total / acumuladores.size();
    }

    private int normalizeFromScale(int value) {
        return Math.max(0, Math.min(100, value));
    }

    private int[] normalizeProbabilities(int local, int empate, int visitante) {
        int total = local + empate + visitante;
        if (total <= 0) {
            return new int[]{33, 34, 33};
        }
        if (total == 100) {
            return new int[]{local, empate, visitante};
        }
        double scale = 100.0 / total;
        int localNorm = (int) Math.round(local * scale);
        int empateNorm = (int) Math.round(empate * scale);
        int visitanteNorm = 100 - localNorm - empateNorm;
        if (visitanteNorm < 0) {
            visitanteNorm = 0;
            empateNorm = Math.max(0, 100 - localNorm - visitanteNorm);
        }
        return new int[]{localNorm, empateNorm, visitanteNorm};
    }

    private static final class TeamSnapshot {
        private final Long equipoId;
        private final String nombre;
        private final int forma;
        private final int rendimientoJugadores;
        private final int h2h;
        private final int partidosAnalizados;
        private final List<String> ultimosResultados;
        private final List<String> jugadoresClave;

        private TeamSnapshot(Long equipoId, String nombre, int forma, int rendimientoJugadores, int h2h, int partidosAnalizados, List<String> ultimosResultados, List<String> jugadoresClave) {
            this.equipoId = equipoId;
            this.nombre = nombre;
            this.forma = forma;
            this.rendimientoJugadores = rendimientoJugadores;
            this.h2h = h2h;
            this.partidosAnalizados = partidosAnalizados;
            this.ultimosResultados = ultimosResultados;
            this.jugadoresClave = jugadoresClave;
        }
    }

    private static final class PlayerAccumulator {
        private final Jugador jugador;
        private double totalScore;
        private int apariciones;

        private PlayerAccumulator(Jugador jugador) {
            this.jugador = jugador;
        }

        private void add(EstadisticaJugador estadistica) {
            totalScore += score(estadistica);
            apariciones++;
        }

        private double averageScore() {
            return apariciones == 0 ? 0 : totalScore / apariciones;
        }

        private PlayerScore toPlayerScore() {
            return new PlayerScore(jugador, averageScore());
        }

        private double score(EstadisticaJugador estadistica) {
            double score = 0;
            score += estadistica.getGoles() * 7.5;
            score += estadistica.getAsistencias() * 4.5;
            score += estadistica.getMinutosJugados() / 90.0 * 2.0;
            score += estadistica.isTitular() ? 1.2 : 0.4;
            score -= estadistica.getAmarillas() * 0.6;
            score -= estadistica.getRojas() * 2.4;
            return Math.max(0, score);
        }
    }

    private record PlayerScore(Jugador jugador, double score) {
        private String label() {
            String nombre = jugador.getNombre() == null ? "" : jugador.getNombre();
            String apellido = jugador.getApellido() == null ? "" : jugador.getApellido();
            String completo = (nombre + " " + apellido).trim();
            int porcentaje = (int) Math.round(Math.min(100, score * 7.5));
            return completo + " (" + porcentaje + "%)";
        }
    }

    private record MatchOutcome(int puntos) {
        private static MatchOutcome victoria() {
            return new MatchOutcome(3);
        }

        private static MatchOutcome empate() {
            return new MatchOutcome(1);
        }

        private static MatchOutcome derrota() {
            return new MatchOutcome(0);
        }

        private static MatchOutcome sinDatos() {
            return new MatchOutcome(0);
        }

        private boolean esVictoria() {
            return puntos == 3;
        }

        private boolean esEmpate() {
            return puntos == 1;
        }
    }
}
