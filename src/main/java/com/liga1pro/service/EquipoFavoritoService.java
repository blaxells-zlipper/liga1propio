package com.liga1pro.service;

import com.liga1pro.model.Equipo;
import com.liga1pro.model.EquipoFavorito;
import com.liga1pro.model.Usuario;
import com.liga1pro.repository.EquipoFavoritoRepository;
import com.liga1pro.repository.EquipoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class EquipoFavoritoService {

    private final EquipoFavoritoRepository equipoFavoritoRepository;
    private final EquipoRepository equipoRepository;
    private final UsuarioService usuarioService;

    @Transactional(readOnly = true)
    public Optional<Equipo> obtenerFavorito(Long usuarioId) {
        return equipoFavoritoRepository.findByUsuarioId(usuarioId)
                .stream()
                .findFirst()
                .map(EquipoFavorito::getEquipo);
    }

    public Equipo marcarFavorito(Long usuarioId, Long equipoId) {
        // Eliminar favorito anterior (solo permitimos 1 equipo favorito por usuario)
        List<EquipoFavorito> actuales = equipoFavoritoRepository.findByUsuarioId(usuarioId);
        equipoFavoritoRepository.deleteAll(actuales);

        Usuario usuario = usuarioService.buscarPorId(usuarioId);
        Equipo equipo = equipoRepository.findById(equipoId)
                .orElseThrow(() -> new RuntimeException("Equipo no encontrado con id: " + equipoId));

        EquipoFavorito favorito = EquipoFavorito.builder()
                .usuario(usuario)
                .equipo(equipo)
                .build();

        equipoFavoritoRepository.save(favorito);
        return equipo;
    }

    public void quitarFavorito(Long usuarioId) {
        List<EquipoFavorito> actuales = equipoFavoritoRepository.findByUsuarioId(usuarioId);
        equipoFavoritoRepository.deleteAll(actuales);
    }
}
