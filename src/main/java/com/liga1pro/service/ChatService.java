package com.liga1pro.service;

import com.liga1pro.dto.MensajeChatDTO;
import com.liga1pro.model.GrupoChat;
import com.liga1pro.model.MensajeChat;
import com.liga1pro.model.MiembroGrupo;
import com.liga1pro.model.Partido;
import com.liga1pro.model.RolMiembro;
import com.liga1pro.model.Usuario;
import com.liga1pro.repository.GrupoChatRepository;
import com.liga1pro.repository.MensajeChatRepository;
import com.liga1pro.repository.MiembroGrupoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private final MensajeChatRepository mensajeChatRepository;
    private final UsuarioService usuarioService;
    private final PartidoService partidoService;
    private final GrupoChatRepository grupoChatRepository;
    private final MiembroGrupoRepository miembroGrupoRepository;

    public MensajeChat guardarMensaje(MensajeChatDTO dto) {
        Usuario usuario = usuarioService.buscarPorId(dto.getUsuarioId());

        Partido partido = null;
        if (dto.getPartidoId() != null) {
            partido = partidoService.buscarPorId(dto.getPartidoId());
        }

        GrupoChat grupoChat = null;
        if (dto.getGrupoChatId() != null) {
            grupoChat = grupoChatRepository.findById(dto.getGrupoChatId())
                    .orElseThrow(() -> new RuntimeException("GrupoChat no encontrado con id: " + dto.getGrupoChatId()));
        }

        MensajeChat mensaje = MensajeChat.builder()
                .contenido(dto.getContenido())
                .usuario(usuario)
                .partido(partido)
                .grupoChat(grupoChat)
                .tipo(dto.getTipo())
                .build();

        return mensajeChatRepository.save(mensaje);
    }

    @Transactional(readOnly = true)
    public List<MensajeChat> obtenerMensajesPartido(Long partidoId) {
        return mensajeChatRepository.findByPartidoIdOrderByTimestampAsc(partidoId);
    }

    @Transactional(readOnly = true)
    public List<MensajeChat> obtenerMensajesGrupo(Long grupoChatId) {
        return mensajeChatRepository.findByGrupoChatIdOrderByTimestampAsc(grupoChatId);
    }

    @Transactional(readOnly = true)
    public List<GrupoChat> obtenerGrupos() {
        return grupoChatRepository.findAll();
    }

    @Transactional(readOnly = true)
    public boolean esMiembro(Long grupoId, Long usuarioId) {
        return miembroGrupoRepository.findByGrupoIdAndUsuarioId(grupoId, usuarioId).isPresent();
    }

    @Transactional(readOnly = true)
    public long contarMiembros(Long grupoId) {
        return miembroGrupoRepository.countByGrupoId(grupoId);
    }

    public MiembroGrupo unirseAGrupo(Long grupoId, Long usuarioId) {
        if (esMiembro(grupoId, usuarioId)) {
            return miembroGrupoRepository.findByGrupoIdAndUsuarioId(grupoId, usuarioId).get();
        }
        GrupoChat grupo = grupoChatRepository.findById(grupoId)
                .orElseThrow(() -> new RuntimeException("Grupo no encontrado"));
        Usuario usuario = usuarioService.buscarPorId(usuarioId);

        MiembroGrupo miembro = MiembroGrupo.builder()
                .grupo(grupo)
                .usuario(usuario)
                .rol(RolMiembro.MIEMBRO)
                .build();
        return miembroGrupoRepository.save(miembro);
    }

    @Transactional
    public void salirDeGrupo(Long grupoId, Long usuarioId) {
        miembroGrupoRepository.deleteByGrupoIdAndUsuarioId(grupoId, usuarioId);
    }
}