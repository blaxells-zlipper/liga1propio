import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { partidoService, estadisticasService } from '../services/apiService'
import { PrediccionIA } from '../components/PrediccionIA'

const formatFecha = (fecha, hora) => {
  if (!fecha) return ''
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const date = new Date(fecha)
  const horaStr = hora ? hora.substring(0, 5) : ''
  return `${dias[date.getUTCDay()]} ${date.getUTCDate()} de ${meses[date.getUTCMonth()]} • ${horaStr}`
}

const estadoBadge = (estado) => {
  if (estado === 'EN_VIVO') return { label: '🔴 EN VIVO', color: '#e53e3e' }
  if (estado === 'FINALIZADO') return { label: '✅ FINALIZADO', color: '#38a169' }
  return { label: '📅 PROGRAMADO', color: '#718096' }
}

export function PartidoDetalle() {
  const { id } = useParams()
  const [partido, setPartido] = useState(null)
  const [estadisticas, setEstadisticas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [partidoRes, statsRes] = await Promise.all([
          partidoService.getById(id),
          estadisticasService.getPartido(id),
        ])
        setPartido(partidoRes.data)
        setEstadisticas(statsRes.data || [])
      } catch (error) {
        console.error('Error cargando partido:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <div className="section-card">Cargando partido...</div>
  if (!partido) return <div className="section-card">Partido no encontrado.</div>

  const badge = estadoBadge(partido.estado)
  const esFinalizado = partido.estado === 'FINALIZADO'
  const esProgramado = partido.estado === 'PROGRAMADO'

  const amarillas = estadisticas.reduce((sum, e) => sum + (e.amarillas || 0), 0)
  const rojas = estadisticas.reduce((sum, e) => sum + (e.rojas || 0), 0)

  const goleadores = estadisticas
    .filter(e => e.goles > 0)
    .sort((a, b) => b.goles - a.goles)

  return (
    <section className="section-card">
      <div className="page-header">
        <Link to="/fixture" className="btn btn-secondary" style={{ marginBottom: '1rem', display: 'inline-block' }}>
          ← Volver al Fixture
        </Link>
        <p className="eyebrow">Jornada {partido.jornada}</p>
        <h1>{partido.equipoLocal?.nombre} vs {partido.equipoVisitante?.nombre}</h1>
      </div>

      <div style={{ textAlign: 'center', padding: '2rem', background: '#1a1a2e', borderRadius: '12px', marginBottom: '2rem', color: 'white' }}>
        <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: badge.color, fontWeight: 'bold' }}>
          {badge.label}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <img
              src={partido.equipoLocal?.escudo}
              alt={partido.equipoLocal?.nombre}
              style={{ width: '64px', height: '64px', objectFit: 'contain', marginBottom: '0.5rem' }}
            />
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{partido.equipoLocal?.nombre}</div>
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
            {esProgramado ? 'vs' : `${partido.golesLocal} - ${partido.golesVisitante}`}
          </div>
          <div style={{ textAlign: 'center' }}>
            <img
              src={partido.equipoVisitante?.escudo}
              alt={partido.equipoVisitante?.nombre}
              style={{ width: '64px', height: '64px', objectFit: 'contain', marginBottom: '0.5rem' }}
            />
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{partido.equipoVisitante?.nombre}</div>
          </div>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#aaa' }}>
          📅 {formatFecha(partido.fecha, partido.hora)} &nbsp;|&nbsp; 📍 {partido.estadio || 'Estadio no disponible'}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-panel">
          <h2>📊 Estadísticas</h2>
          <ul className="detail-list">
            <li>⚽ Goles local: <strong>{partido.golesLocal ?? '-'}</strong></li>
            <li>⚽ Goles visitante: <strong>{partido.golesVisitante ?? '-'}</strong></li>
            <li>🟨 Tarjetas amarillas: <strong>{amarillas}</strong></li>
            <li>🟥 Tarjetas rojas: <strong>{rojas}</strong></li>
            <li>👟 Jugadores con stats: <strong>{estadisticas.length}</strong></li>
          </ul>
        </div>

        <div className="detail-panel">
          <h2>⚽ Goleadores</h2>
          {goleadores.length === 0 ? (
            <p style={{ color: '#718096' }}>Sin goles registrados</p>
          ) : (
            <ul className="detail-list">
              {goleadores.map(e => (
                <li key={e.id}>
                  <strong>{e.jugador?.nombre} {e.jugador?.apellido}</strong> — {e.goles} gol{e.goles !== 1 ? 'es' : ''}
                </li>
              ))}
            </ul>
          )}
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to={`/equipos/${partido.equipoLocal?.id}`} className="btn btn-secondary btn-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <img src={partido.equipoLocal?.escudo} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
              Ver {partido.equipoLocal?.nombre}
            </Link>
            <Link to={`/equipos/${partido.equipoVisitante?.id}`} className="btn btn-secondary btn-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <img src={partido.equipoVisitante?.escudo} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
              Ver {partido.equipoVisitante?.nombre}
            </Link>
            {esFinalizado ? (
              <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f0f0f0', borderRadius: '8px', color: '#718096', fontSize: '0.9rem' }}>
                🔒 Chat cerrado — el partido finalizó
              </div>
            ) : (
              <Link to={`/chat/partido/${id}`} className="btn btn-primary btn-full">
                💬 Chat del partido
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Predicción IA — solo para partidos programados */}
      {esProgramado && <PrediccionIA partido={partido} />}

    </section>
  )
}