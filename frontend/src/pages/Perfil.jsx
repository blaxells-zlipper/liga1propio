import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { favoritoService, equipoService } from '../services/apiService'

export function Perfil() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [equipos, setEquipos] = useState([])
  const [equipoFavorito, setEquipoFavorito] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notificaciones, setNotificaciones] = useState({
    generales: true,
    partidos: true,
    noticias: false
  })

  useEffect(() => {
    const load = async () => {
      try {
        const equiposRes = await equipoService.getAll()
        setEquipos(equiposRes.data || [])

        if (user?.id) {
          const favRes = await favoritoService.get(user.id)
          if (favRes.data && favRes.data.id) {
            setEquipoFavorito(favRes.data)
          }
        }
      } catch (error) {
        console.error('Error cargando perfil:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleNotificacion = (tipo) => {
    setNotificaciones(prev => ({
      ...prev,
      [tipo]: !prev[tipo]
    }))
  }

  const handleSelectEquipo = async (e) => {
    const equipoId = Number(e.target.value)
    if (!equipoId || !user?.id) return

    try {
      const res = await favoritoService.marcar(user.id, equipoId)
      setEquipoFavorito(res.data)
    } catch (error) {
      console.error('Error guardando favorito:', error)
    }
  }

  return (
    <section className="perfil-section">
      <div className="perfil-header">
        <h1>👤 Mi Perfil</h1>
      </div>

      {/* Tarjeta de Perfil */}
      <div className="perfil-card">
        <div className="perfil-top">
          <div className="perfil-avatar">👤</div>
          <div className="perfil-info">
            <h2 className="perfil-nombre">{user?.nombre || 'Usuario Liga1 Pro'}</h2>
            <p className="perfil-member">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Equipo Favorito */}
      <div className="perfil-card">
        <h3 className="section-title">❤️ Equipo Favorito</h3>
        <p className="section-description">Selecciona tu equipo favorito para recibir actualizaciones personalizadas</p>

        {loading ? (
          <p>Cargando equipos...</p>
        ) : (
          <>
            <select
              value={equipoFavorito?.id || ''}
              onChange={handleSelectEquipo}
              className="equipo-select"
            >
              <option value="" disabled>Selecciona un equipo</option>
              {equipos.map(equipo => (
                <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>
              ))}
            </select>

            {equipoFavorito && (
              <div className="equipo-selected">
                <p className="equipo-selected-nombre">{equipoFavorito.nombre}</p>
                <p className="equipo-selected-label">Tu equipo favorito</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Notificaciones */}
      <div className="perfil-card">
        <h3 className="section-title">🔔 Notificaciones</h3>

        <div className="notificacion-item">
          <div className="notificacion-content">
            <p className="notificacion-titulo">Notificaciones generales</p>
            <p className="notificacion-descripcion">Recibe todas las notificaciones</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notificaciones.generales}
              onChange={() => toggleNotificacion('generales')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="notificacion-item">
          <div className="notificacion-content">
            <p className="notificacion-titulo">Alertas de partidos</p>
            <p className="notificacion-descripcion">Notificaciones antes de cada partido de tu equipo</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notificaciones.partidos}
              onChange={() => toggleNotificacion('partidos')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="notificacion-item">
          <div className="notificacion-content">
            <p className="notificacion-titulo">Noticias destacadas</p>
            <p className="notificacion-descripcion">Recibe las noticias más importantes</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notificaciones.noticias}
              onChange={() => toggleNotificacion('noticias')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Configuración */}
      <div className="perfil-card">
        <h3 className="section-title">⚙️ Configuración</h3>

        <button className="config-button">Cambiar contraseña</button>
        <button className="config-button">Privacidad</button>
        <button className="config-button">Términos y condiciones</button>
      </div>

      {/* Cerrar sesión */}
      <div className="perfil-card">
        <button className="btn-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </section>
  )
}