import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { partidoService } from '../services/apiService'
import '../styles/ProximosPartidos.css'

export function ProximosPartidos() {
  const [partidos, setPartidos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPartidos = async () => {
      try {
        const response = await partidoService.getByEstado('PROGRAMADO')
        setPartidos((response.data || []).slice(0, 3))
      } catch (error) {
        console.error('Error cargando próximos partidos:', error)
      } finally {
        setLoading(false)
      }
    }
    loadPartidos()
  }, [])

  if (loading) {
    return <div className="section">Cargando próximos partidos...</div>
  }

  const formatFecha = (fecha, hora) => {
    const date = new Date(fecha)
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const horaStr = hora ? hora.substring(0, 5) : ''
    return `${dias[date.getUTCDay()]} ${date.getUTCDate()} ${meses[date.getUTCMonth()]} • ${horaStr}`
  }

  return (
    <section className="proximos-partidos">
      <h2>Próximos Partidos</h2>
      <div className="partidos-grid">
        {partidos.map((partido) => (
          <Link key={partido.id} to={`/partidos/${partido.id}`} className="partido-card-prox" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="partido-fecha">
              <span>⏰ {formatFecha(partido.fecha, partido.hora)}</span>
            </div>
            <div className="partido-matchup">
              <div className="equipo">
                <img src={partido.equipoLocal?.escudo} alt={partido.equipoLocal?.nombre} className="logo" />
                <span>{partido.equipoLocal?.nombre}</span>
              </div>
              <span className="vs">vs</span>
              <div className="equipo">
                <img src={partido.equipoVisitante?.escudo} alt={partido.equipoVisitante?.nombre} className="logo" />
                <span>{partido.equipoVisitante?.nombre}</span>
              </div>
            </div>
            <div className="partido-estadio">
              <span>📍 {partido.estadio || 'Estadio no disponible'}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}