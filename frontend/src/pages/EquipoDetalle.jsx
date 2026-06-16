import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { equipoService, jugadorService, favoritoService } from '../services/apiService'
import { useAuth } from '../context/AuthContext'

export function EquipoDetalle() {
  const { id } = useParams()
  const { user } = useAuth()
  const [equipo, setEquipo] = useState(null)
  const [jugadores, setJugadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [esFavorito, setEsFavorito] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  useEffect(() => {
    const loadEquipo = async () => {
      try {
        const [equipoRes, jugadoresRes] = await Promise.all([
          equipoService.getById(id),
          jugadorService.getByEquipo(id),
        ])
        setEquipo(equipoRes.data)
        setJugadores(jugadoresRes.data || [])

        if (user?.id) {
          const favRes = await favoritoService.get(user.id)
          if (favRes.data && favRes.data.id === Number(id)) {
            setEsFavorito(true)
          } else {
            setEsFavorito(false)
          }
        }
      } catch (error) {
        console.error('Error cargando equipo:', error)
      } finally {
        setLoading(false)
      }
    }
    loadEquipo()
  }, [id, user])

  const handleToggleFavorito = async () => {
    if (!user?.id) return
    setFavLoading(true)
    try {
      if (esFavorito) {
        await favoritoService.quitar(user.id)
        setEsFavorito(false)
      } else {
        await favoritoService.marcar(user.id, Number(id))
        setEsFavorito(true)
      }
    } catch (error) {
      console.error('Error actualizando favorito:', error)
    } finally {
      setFavLoading(false)
    }
  }

  if (loading) {
    return <div className="section-card">Cargando equipo...</div>
  }

  return (
    <section className="section-card">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {equipo?.escudo && (
            <img
              src={equipo.escudo}
              alt={equipo.nombre}
              style={{ width: '64px', height: '64px', objectFit: 'contain' }}
            />
          )}
          <div>
            <p className="eyebrow">Club</p>
            <h1>{equipo?.nombre || 'Equipo no encontrado'}</h1>
          </div>
        </div>
        {user && (
          <button
            className={`btn ${esFavorito ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleToggleFavorito}
            disabled={favLoading}
          >
            {esFavorito ? '❤️ Tu equipo favorito' : '🤍 Marcar como favorito'}
          </button>
        )}
      </div>
      <div className="detail-grid">
        <div className="detail-panel">
          <p className="detail-label">Ciudad</p>
          <p>{equipo?.ciudad || 'No disponible'}</p>
          <p className="detail-label">Estadio</p>
          <p>{equipo?.estadio || equipo?.estadioNombre || 'No disponible'}</p>
          <p className="detail-label">Director técnico</p>
          <p>{equipo?.entrenador || equipo?.directorTecnico || 'Pendiente'}</p>
          <p className="detail-label">Fundación</p>
          <p>{equipo?.fundacion || 'No disponible'}</p>
        </div>
        <div className="detail-panel">
          <h2>Jugadores</h2>
          <ul className="detail-list">
            {jugadores.length > 0 ? (
              jugadores.map((jugador) => (
                <li key={jugador.id}>
                  <Link to={`/jugadores/${jugador.id}`} className="detail-link">
                    {jugador.nombre}
                  </Link>
                  <span>{jugador.posicion || 'N/A'}</span>
                </li>
              ))
            ) : (
              <li>No se encontraron jugadores para este equipo.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  )
}