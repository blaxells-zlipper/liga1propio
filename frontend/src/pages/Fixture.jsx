import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { partidoService } from '../services/apiService'

const formatFecha = (fecha) => {
  if (!fecha) return ''
  const date = new Date(fecha)
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${dias[date.getUTCDay()]} ${date.getUTCDate()} ${meses[date.getUTCMonth()]}`
}

export function Fixture() {
  const [partidos, setPartidos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPartidos = async () => {
      try {
        const response = await partidoService.getAll()
        setPartidos(response.data || [])
      } catch (error) {
        console.error('Error cargando el fixture:', error)
      } finally {
        setLoading(false)
      }
    }
    loadPartidos()
  }, [])

  return (
    <section className="section-card">
      <div className="page-header">
        <div>
          <p className="eyebrow">Fixture</p>
          <h1>Partidos programados</h1>
        </div>
      </div>
      {loading ? (
        <p>Cargando fixture...</p>
      ) : (
        <div className="cards-grid">
          {partidos.map((partido) => (
            <Link key={partido.id} to={`/partidos/${partido.id}`} className="card-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card-row">
                <span className="card-label">{formatFecha(partido.fecha)} • {partido.hora?.substring(0,5)}</span>
                <span className="card-badge">{partido.estado || 'PROGRAMADO'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', margin: '1rem 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <img src={partido.equipoLocal?.escudo} alt={partido.equipoLocal?.nombre} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}>{partido.equipoLocal?.nombre}</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#999' }}>
                  {partido.estado === 'FINALIZADO' ? `${partido.golesLocal} - ${partido.golesVisitante}` : 'vs'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <img src={partido.equipoVisitante?.escudo} alt={partido.equipoVisitante?.nombre} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}>{partido.equipoVisitante?.nombre}</span>
                </div>
              </div>
              <p className="card-subtitle">📍 {partido.estadio || 'Estadio sin datos'}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}