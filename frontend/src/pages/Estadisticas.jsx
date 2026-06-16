import { useState, useEffect } from 'react'
import { estadisticasService } from '../services/apiService'

export function Estadisticas() {
  const [goleadores, setGoleadores] = useState([])
  const [asistentes, setAsistentes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await estadisticasService.getGoleadores()
        const data = response.data || []

        const parsed = data.map((item) => ({
          id: item[0].id,
          nombre: `${item[0].nombre} ${item[0].apellido}`,
          equipo: item[0].equipo?.nombre || 'Sin equipo',
          goles: item[1] ?? 0,
          asistencias: 0, // el backend no tiene endpoint separado aún
        }))

        // goleadores: ordenados por goles desc
        const porGoles = [...parsed].sort((a, b) => b.goles - a.goles)
        setGoleadores(porGoles)

        // asistentes: los que tienen estadísticas cargadas desde el backend
        // usamos el mismo endpoint pero filtramos por asistencias cuando el backend lo soporte
        // por ahora mostramos los mismos jugadores ordenados por nombre
        const porAsistencias = [...parsed].sort((a, b) => b.asistencias - a.asistencias)
        setAsistentes(porAsistencias)

      } catch (error) {
        console.error('Error cargando estadísticas:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalGoles = goleadores.reduce((sum, j) => sum + j.goles, 0)
  const promedioGoles = goleadores.length > 0
    ? (totalGoles / goleadores.length).toFixed(1)
    : '0.0'

  // estadísticas de equipos calculadas desde goleadores
  const equipoGoles = goleadores.reduce((acc, j) => {
    acc[j.equipo] = (acc[j.equipo] || 0) + j.goles
    return acc
  }, {})
  const mejorAtaque = Object.entries(equipoGoles).sort((a, b) => b[1] - a[1])[0]

  return (
    <section className="section-card estadisticas-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Estadísticas</p>
          <h1>Estadísticas del Torneo</h1>
        </div>
      </div>

      {loading ? (
        <p>Cargando estadísticas...</p>
      ) : (
        <>
          <div className="stats-two-columns">
            <article className="stats-column">
              <h2 className="column-title">📊 Tabla de Goleadores</h2>
              <div className="scorers-list">
                {goleadores.map((jugador, index) => (
                  <div key={jugador.id} className="scorer-row">
                    <span className="scorer-rank">{index + 1}</span>
                    <div className="scorer-info">
                      <h3>{jugador.nombre}</h3>
                      <p>{jugador.equipo}</p>
                    </div>
                    <span className="scorer-value">{jugador.goles}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="stats-column">
              <h2 className="column-title">📈 Jugadores con Estadísticas</h2>
              <div className="scorers-list">
                {asistentes.map((jugador, index) => (
                  <div key={jugador.id} className="scorer-row">
                    <span className="scorer-rank">{index + 1}</span>
                    <div className="scorer-info">
                      <h3>{jugador.nombre}</h3>
                      <p>{jugador.equipo}</p>
                    </div>
                    <span className="scorer-value">{jugador.goles} gol{jugador.goles !== 1 ? 'es' : ''}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="stats-by-team">
            <h2>📍 Estadísticas por Equipos</h2>
            <div className="team-stats-grid">
              <div className="team-stat-card">
                <p className="team-stat-label">MEJOR ATAQUE</p>
                <h3>{mejorAtaque ? mejorAtaque[0] : '—'}</h3>
                <p className="team-stat-value">{mejorAtaque ? `${mejorAtaque[1]} goles` : '—'}</p>
              </div>
              <div className="team-stat-card">
                <p className="team-stat-label">TOTAL GOLES</p>
                <h3>Jornada 16</h3>
                <p className="team-stat-value">{totalGoles} goles</p>
              </div>
              <div className="team-stat-card">
                <p className="team-stat-label">PROMEDIO</p>
                <h3>Por jugador</h3>
                <p className="team-stat-value">{promedioGoles} goles</p>
              </div>
              <div className="team-stat-card">
                <p className="team-stat-label">JUGADORES</p>
                <h3>Con estadísticas</h3>
                <p className="team-stat-value">{goleadores.length} registrados</p>
              </div>
            </div>
          </div>

          <div className="stats-summary">
            <div className="summary-card summary-red">
              <p className="summary-label">Goles totales</p>
              <div className="summary-value">{totalGoles}</div>
            </div>
            <div className="summary-card summary-blue">
              <p className="summary-label">Promedio por jugador</p>
              <div className="summary-value">{promedioGoles}</div>
            </div>
            <div className="summary-card summary-green">
              <p className="summary-label">Jugadores registrados</p>
              <div className="summary-value">{goleadores.length}</div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}