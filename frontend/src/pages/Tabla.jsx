import { useState, useEffect } from 'react'
import { tablaPosicionesService, equipoService } from '../services/apiService'

export function Tabla() {
  const [tabla, setTabla] = useState([])
  const [escudos, setEscudos] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [tablaRes, equiposRes] = await Promise.all([
          tablaPosicionesService.get(),
          equipoService.getAll(),
        ])
        setTabla(tablaRes.data || [])

        const mapaEscudos = {}
        ;(equiposRes.data || []).forEach(eq => {
          mapaEscudos[eq.nombre] = eq.escudo
        })
        setEscudos(mapaEscudos)
      } catch (error) {
        console.error('Error cargando la tabla:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const leader = tabla[0]
  const mejorAtaque = tabla.reduce((best, row) => {
    const goles = row.gf ?? 0
    return goles > (best.gf ?? 0) ? row : best
  }, tabla[0] || {})
  const mejorDefensa = tabla.reduce((best, row) => {
    const goles = row.gc ?? 0
    return goles < (best.gc ?? Infinity) ? row : best
  }, tabla[0] || {})

  return (
    <section className="section-card tabla-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Tabla de posiciones</p>
          <h1>Clasificación del torneo</h1>
        </div>
      </div>
      {loading ? (
        <p>Cargando tabla de posiciones...</p>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table-standard">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipo</th>
                  <th>PJ</th>
                  <th>PG</th>
                  <th>PE</th>
                  <th>PP</th>
                  <th>GF</th>
                  <th>GC</th>
                  <th>DG</th>
                  <th>PTS</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((row, index) => (
                  <tr key={index} className={index === 0 ? 'table-row-highlight' : ''}>
                    <td>{row.posicion || index + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <img src={escudos[row.equipo]} alt={row.equipo} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                        <span>{row.equipo}</span>
                      </div>
                    </td>
                    <td>{row.pj ?? '-'}</td>
                    <td>{row.pg ?? '-'}</td>
                    <td>{row.pe ?? '-'}</td>
                    <td>{row.pp ?? '-'}</td>
                    <td>{row.gf ?? '-'}</td>
                    <td>{row.gc ?? '-'}</td>
                    <td>{row.dg ?? '-'}</td>
                    <td>{row.pts ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-summary-cards">
            <article className="metric-card">
              <span className="metric-label">Líder actual</span>
              <h3>{leader?.equipo || 'Sin datos'}</h3>
              <p>{leader?.pts ?? 0} puntos</p>
            </article>
            <article className="metric-card">
              <span className="metric-label">Mejor ataque</span>
              <h3>{mejorAtaque?.equipo || 'Sin datos'}</h3>
              <p>{mejorAtaque?.gf ?? 0} goles a favor</p>
            </article>
            <article className="metric-card">
              <span className="metric-label">Mejor defensa</span>
              <h3>{mejorDefensa?.equipo || 'Sin datos'}</h3>
              <p>{mejorDefensa?.gc ?? 0} goles en contra</p>
            </article>
          </div>
        </>
      )}
    </section>
  )
}