package com.liga1pro.controller;

import com.liga1pro.dto.MensajeChatDTO;
import com.liga1pro.model.GrupoChat;
import com.liga1pro.model.MensajeChat;
import com.liga1pro.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    @MessageMapping("/chat.partido/{partidoId}")
    public void enviarMensajePartido(
            @DestinationVariable Long partidoId,
            MensajeChatDTO mensajeDto) {
        chatService.guardarMensaje(mensajeDto);
        messagingTemplate.convertAndSend("/topic/partido/" + partidoId, mensajeDto);
    }

    @MessageMapping("/chat.grupo/{grupoId}")
    public void enviarMensajeGrupo(
            @DestinationVariable Long grupoId,
            MensajeChatDTO mensajeDto) {
        chatService.guardarMensaje(mensajeDto);
        messagingTemplate.convertAndSend("/topic/grupo/" + grupoId, mensajeDto);
    }

    @GetMapping("/partido/{partidoId}")
    public ResponseEntity<List<MensajeChat>> historialPartido(
            @PathVariable Long partidoId) {
        return ResponseEntity.ok(chatService.obtenerMensajesPartido(partidoId));
    }

    @GetMapping("/grupo/{grupoChatId}")
    public ResponseEntity<List<MensajeChat>> historialGrupo(
            @PathVariable Long grupoChatId) {
        return ResponseEntity.ok(chatService.obtenerMensajesGrupo(grupoChatId));
    }

    @GetMapping("/grupos")
    public ResponseEntity<List<GrupoChat>> obtenerGrupos() {
        return ResponseEntity.ok(chatService.obtenerGrupos());
    }

    // =========================================================
    // MEMBRESÍA DE GRUPOS
    // =========================================================

    @GetMapping("/grupos/{grupoId}/info")
    public ResponseEntity<Map<String, Object>> infoGrupo(
            @PathVariable Long grupoId,
            @RequestParam(required = false) Long usuarioId) {

        long totalMiembros = chatService.contarMiembros(grupoId);
        boolean esMiembro = usuarioId != null && chatService.esMiembro(grupoId, usuarioId);

        return ResponseEntity.ok(Map.of(
                "totalMiembros", totalMiembros,
                "esMiembro", esMiembro
        ));
    }

    @PostMapping("/grupos/{grupoId}/unirse")
    public ResponseEntity<?> unirseAGrupo(
            @PathVariable Long grupoId,
            @RequestBody Map<String, Long> body) {

        Long usuarioId = body.get("usuarioId");
        if (usuarioId == null) {
            return ResponseEntity.badRequest().body("usuarioId es requerido");
        }
        chatService.unirseAGrupo(grupoId, usuarioId);
        return ResponseEntity.ok(Map.of("mensaje", "Te has unido al grupo"));
    }

    @PostMapping("/grupos/{grupoId}/salir")
    public ResponseEntity<?> salirDeGrupo(
            @PathVariable Long grupoId,
            @RequestBody Map<String, Long> body) {

        Long usuarioId = body.get("usuarioId");
        if (usuarioId == null) {
            return ResponseEntity.badRequest().body("usuarioId es requerido");
        }
        chatService.salirDeGrupo(grupoId, usuarioId);
        return ResponseEntity.ok(Map.of("mensaje", "Has salido del grupo"));
    }
}