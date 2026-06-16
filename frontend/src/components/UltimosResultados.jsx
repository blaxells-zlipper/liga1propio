import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { partidoService } from '../services/apiService'
import '../styles/UltimosResultados.css'

export function UltimosResultados() {
  const [partidos, setPartidos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPartidos = async () => {
      try {
        const response = await partidoService.getByEstado('FINALIZADO')
        setPartidos((response.data || []).reverse().slice(0, 3))
      } catch (error) {
        console.error('Error cargando últimos resultados:', error)
      } finally {
        setLoading(false)
      }
    }
    loadPartidos()
  }, [])

  if (loading) {
    return <div className="section">Cargando resultados...</div>
  }

  const formatFecha = (fecha) => {
    const date = new Date(fecha)
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    return `${date.getUTCDate()} ${meses[date.getUTCMonth()]}`
  }

  return (
    <section className="ultimos-resultados">
      <div className="resultados-header">
        <h2>Últimos Resultados</h2>
        <Link to="/fixture" className="ver-todos">Ver todos →</Link>
      </div>
      <div className="resultados-grid">
        {partidos.map((partido) => (
          <Link key={partido.id} to={`/partidos/${partido.id}`} className="resultado-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="resultado-fecha">
              {formatFecha(partido.fecha)}
            </div>
            <div className="resultado-match">
              <div className="equipo">
                <img src={partido.equipoLocal?.escudo} alt={partido.equipoLocal?.nombre} className="logo" />
                <span>{partido.equipoLocal?.nombre}</span>
              </div>
              <div className="marcador-resultado">{partido.golesLocal} - {partido.golesVisitante}</div>
              <div className="equipo">
                <img src={partido.equipoVisitante?.escudo} alt={partido.equipoVisitante?.nombre} className="logo" />
                <span>{partido.equipoVisitante?.nombre}</span>
              </div>
            </div>
            <div className="resultado-estadio">
              <span>📍 {partido.estadio || 'Estadio no disponible'}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}