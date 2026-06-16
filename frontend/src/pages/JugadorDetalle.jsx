import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { jugadorService, estadisticasService } from '../services/apiService'

const getIniciales = (nombre, apellido) => {
  const n = nombre?.[0] || ''
  const a = apellido?.[0] || ''
  return (n + a).toUpperCase() || '?'
}

export function JugadorDetalle() {
  const { id } = useParams()
  const [jugador, setJugador] = useState(null)
  const [estadisticas, setEstadisticas] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadJugador = async () => {
      setLoading(true)
      try {
        const jugadorRes = await jugadorService.getById(id)
        setJugador(jugadorRes.data)
      } catch (error) {
        console.error('Error cargando jugador:', error)
        setJugador(null)
      }

      try {
        const estadisticasRes = await estadisticasService.getJugador(id)
        setEstadisticas(estadisticasRes.data)
      } catch (error) {
        console.error('Error cargando estadísticas:', error)
        setEstadisticas(null)
      }

      setLoading(false)
    }
    loadJugador()
  }, [id])

  if (loading) {
    return <div className="section-card">Cargando jugador...</div>
  }

  const nombreCompleto = jugador
    ? `${jugador.nombre || ''} ${jugador.apellido || ''}`.trim()
    : 'Jugador no encontrado'

  return (
    <section className="section-card">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {jugador?.foto ? (
            <img
              src={jugador.foto}
              alt={nombreCompleto}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#1a1a2e',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 'bold',
                flexShrink: 0,
              }}
            >
              {getIniciales(jugador?.nombre, jugador?.apellido)}
            </div>
          )}
          <div>
            <p className="eyebrow">Jugador</p>
            <h1>{nombreCompleto}</h1>
          </div>
        </div>
      </div>
      <div className="detail-grid">
        <div className="detail-panel">
          <p className="detail-label">Equipo</p>
          {jugador?.equipo ? (
            <Link
              to={`/equipos/${jugador.equipo.id}`}
              className="detail-link"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {jugador.equipo.escudo && (
                <img
                  src={jugador.equipo.escudo}
                  alt={jugador.equipo.nombre}
                  style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                />
              )}
              {jugador.equipo.nombre}
            </Link>
          ) : (
            <p>No disponible</p>
          )}
          <p className="detail-label">Posición</p>
          <p>{jugador?.posicion || 'No disponible'}</p>
          <p className="detail-label">Número</p>
          <p>{jugador?.numeroCamiseta ?? 'No disponible'}</p>
          <p className="detail-label">Nacionalidad</p>
          <p>{jugador?.nacionalidad || 'No disponible'}</p>
          <p className="detail-label">Edad</p>
          <p>{jugador?.edad ?? 'No disponible'}</p>
        </div>
        <div className="detail-panel">
          <h2>Estadísticas</h2>
          <ul className="detail-list">
            <li>Goles: {estadisticas?.goles ?? '0'}</li>
            <li>Asistencias: {estadisticas?.asistencias ?? '0'}</li>
            <li>Partidos: {estadisticas?.partidos ?? '0'}</li>
            <li>Tarjetas amarillas: {estadisticas?.amarillas ?? '0'}</li>
            <li>Tarjetas rojas: {estadisticas?.rojas ?? '0'}</li>
          </ul>
        </div>
      </div>
    </section>
  )
}