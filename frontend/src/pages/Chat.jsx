import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { chatService, partidoService } from '../services/apiService'
import { useAuth } from '../context/AuthContext'
import { wsService } from '../services/wsService'
import '../styles/Chat.css'

export function Chat() {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const [view, setView] = useState(type && id ? 'conversation' : 'list')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [groups, setGroups] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [partidoInfo, setPartidoInfo] = useState(null)

  // Membresía de grupo
  const [esMiembro, setEsMiembro] = useState(true)
  const [totalMiembros, setTotalMiembros] = useState(0)
  const [joinLoading, setJoinLoading] = useState(false)

  const isOwnMessage = (message) => {
    return message.usuario?.id === user?.id || message.usuario?.email === user?.email
  }

  const chatsFiltrados = groups.filter((chat) =>
    chat.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatPreview = (chat) => chat.descripcion || 'Empieza la conversación...'

  useEffect(() => {
    loadGroups()
  }, [])

  useEffect(() => {
    if (type && id) {
      setView('conversation')
      loadConversation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, id])

  const loadGroups = async () => {
    try {
      const response = await chatService.getGrupos()
      setGroups(response.data || [])
    } catch (err) {
      console.error('Error cargando grupos:', err)
      setError('No se pudieron cargar los chats. Intenta más tarde.')
    }
  }

  const loadConversation = async () => {
    try {
      setLoading(true)
      setError('')
      setPartidoInfo(null)
      setSelectedChat(null)

      if (token && (!wsService.client || !wsService.client.connected)) {
        await wsService.connect(token)
      }

      const routeType = type === 'grupo' ? 'grupo' : 'partido'
      const destination = routeType === 'partido' ? `/topic/partido/${id}` : `/topic/grupo/${id}`

      if (routeType === 'partido') {
        const [msgRes, partidoRes] = await Promise.all([
          chatService.getPartido(id),
          partidoService.getById(id),
        ])
        setMessages(msgRes.data || [])
        setPartidoInfo(partidoRes.data)
        setEsMiembro(true) // chats de partido son de acceso libre
      } else {
        const [msgRes, groupsRes, infoRes] = await Promise.all([
          chatService.getGrupo(id),
          chatService.getGrupos(),
          chatService.getInfoGrupo(id, user?.id),
        ])
        setMessages(msgRes.data || [])
        setGroups(groupsRes.data || [])
        const currentChat = groupsRes.data?.find((group) => group.id === Number(id))
        setSelectedChat(currentChat || null)

        setTotalMiembros(infoRes.data?.totalMiembros ?? 0)
        setEsMiembro(infoRes.data?.esMiembro ?? false)
      }

      wsService.desuscribirse(destination)
      wsService.suscribirse(destination, (newMessage) => {
        setMessages((prev) => [...prev, newMessage])
      })
    } catch (err) {
      setError('No fue posible cargar el chat. Intenta de nuevo más tarde.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChatClick = (chatId) => {
    setView('conversation')
    navigate(`/chat/grupo/${chatId}`)
  }

  const handleBack = () => {
    setView('list')
    setMessages([])
    setInput('')
    setPartidoInfo(null)
    navigate('/chat')
  }

  const handleJoin = async () => {
    if (!user?.id) return
    setJoinLoading(true)
    try {
      await chatService.unirseAGrupo(id, user.id)
      setEsMiembro(true)
      setTotalMiembros((prev) => prev + 1)
    } catch (err) {
      console.error('Error al unirse:', err)
    } finally {
      setJoinLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!user?.id) return
    setJoinLoading(true)
    try {
      await chatService.salirDeGrupo(id, user.id)
      setEsMiembro(false)
      setTotalMiembros((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error al salir:', err)
    } finally {
      setJoinLoading(false)
    }
  }

  const handleSend = () => {
    if (!input.trim()) return

    if (type === 'grupo' && id) {
      const payload = {
        contenido: input.trim(),
        usuarioId: user?.id || 0,
        partidoId: null,
        grupoChatId: Number(id),
        tipo: 'GRUPO',
      }
      wsService.publicar(`/app/chat.grupo/${id}`, payload)
      setInput('')
    } else if (type === 'partido' && id) {
      const payload = {
        contenido: input.trim(),
        usuarioId: user?.id || 0,
        partidoId: Number(id),
        grupoChatId: null,
        tipo: 'PARTIDO',
      }
      wsService.publicar(`/app/chat.partido/${id}`, payload)
      setInput('')
    }
  }

  // Vista de lista de chats
  if (view === 'list') {
    return (
      <section className="chat-page">
        <div className="chat-card chat-list-card">
          <div className="chats-header">
            <div>
              <p className="section-label">Mensajes</p>
              <h1>Chats</h1>
            </div>
          </div>

          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar conversaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="chats-list">
            {chatsFiltrados.length === 0 ? (
              <div className="empty-state">
                <p>No se encontraron chats</p>
              </div>
            ) : (
              chatsFiltrados.map(chat => (
                <div
                  key={chat.id}
                  className="chat-item"
                  onClick={() => handleChatClick(chat.id)}
                >
                  <div className="chat-avatar">{chat.icono || chat.nombre?.charAt(0)}</div>
                  <div className="chat-content">
                    <div className="chat-header-row">
                      <h3 className="chat-name">{chat.nombre}</h3>
                    </div>
                    <p className="chat-preview">{formatPreview(chat)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    )
  }

  // Header dinámico según tipo
  const headerTitle = type === 'partido' && partidoInfo
    ? `${partidoInfo.equipoLocal?.nombre} vs ${partidoInfo.equipoVisitante?.nombre}`
    : selectedChat?.nombre || 'Chat'

  const headerSubtitle = type === 'partido' && partidoInfo
    ? `⚽ Chat en vivo del partido — ${partidoInfo.estado}`
    : `${totalMiembros} miembro${totalMiembros !== 1 ? 's' : ''}`

  const headerIcon = type === 'partido' ? '⚽' : (selectedChat?.icono || selectedChat?.nombre?.charAt(0) || '💬')

  // Vista de conversación
  return (
    <section className="chat-page">
      <div className="chat-card conversation-card">
        <div className="conversation-header">
          <button className="back-button" onClick={handleBack}>
            ← Chats
          </button>
          <div className="conversation-title">
            <div className="chat-avatar large">{headerIcon}</div>
            <div>
              <h2>{headerTitle}</h2>
              <p className="members-info">{headerSubtitle}</p>
            </div>
          </div>
          {type === 'grupo' && esMiembro && (
            <button className="btn btn-secondary" onClick={handleLeave} disabled={joinLoading} style={{ marginLeft: 'auto' }}>
              Salir del grupo
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-card"><p>Cargando chat...</p></div>
        ) : error ? (
          <div className="error-card"><p>{error}</p></div>
        ) : type === 'grupo' && !esMiembro ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ marginBottom: '1.5rem', color: '#718096' }}>
              {selectedChat?.descripcion}
            </p>
            <p style={{ marginBottom: '1.5rem' }}>
              Únete a este grupo para ver los mensajes y participar en la conversación.
            </p>
            <button className="btn btn-primary" onClick={handleJoin} disabled={joinLoading}>
              {joinLoading ? 'Uniéndome...' : '➕ Unirme al grupo'}
            </button>
          </div>
        ) : (
          <>
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-messages">
                  <p>Aún no hay mensajes en este chat.</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={`${message.id ?? index}-${message.contenido}-${index}`}
                    className={`message-bubble ${isOwnMessage(message) ? 'mine' : 'other'}`}
                  >
                    <span className="message-user">{message.usuario?.nombre || message.usuario?.email || 'Usuario'}</span>
                    <p className="message-text">{message.contenido}</p>
                  </div>
                ))
              )}
            </div>

            {type === 'partido' && partidoInfo?.estado === 'FINALIZADO' ? (
              <div className="chat-closed-banner">
                🔒 Este chat se cerró porque el partido finalizó
              </div>
            ) : (
              <div className="message-input-area">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="message-input"
                />
                <button className="send-button" onClick={handleSend}>Enviar</button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}