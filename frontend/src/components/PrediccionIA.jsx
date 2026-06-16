import { useState } from 'react'
import { tablaPosicionesService, jugadorService } from '../services/apiService'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY

export function PrediccionIA({ partido }) {
  const [prediccion, setPrediccion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generarPrediccion = async () => {
    setLoading(true)
    setError(null)
    setPrediccion(null)

    try {
      const [tablaRes, jugLocRes, jugVisRes] = await Promise.all([
        tablaPosicionesService.get(),
        jugadorService.getByEquipo(partido.equipoLocal.id),
        jugadorService.getByEquipo(partido.equipoVisitante.id),
      ])

      const tabla = tablaRes.data || []
      const jugLocal = jugLocRes.data || []
      const jugVisitante = jugVisRes.data || []

      const infoLocal = tabla.find(t => t.equipo === partido.equipoLocal.nombre)
      const infoVisitante = tabla.find(t => t.equipo === partido.equipoVisitante.nombre)

      const prompt = `Eres un analista experto en fútbol peruano Liga 1. Analiza este partido y genera una predicción realista basada en los datos reales.

PARTIDO: ${partido.equipoLocal.nombre} (LOCAL) vs ${partido.equipoVisitante.nombre} (VISITANTE)
Jornada ${partido.jornada} | Estadio: ${partido.estadio}
 
POSICIÓN EN TABLA:
- ${partido.equipoLocal.nombre}: Posición ${infoLocal?.posicion ?? 'N/A'}, ${infoLocal?.pts ?? 0} pts, ${infoLocal?.pg ?? 0}G ${infoLocal?.pe ?? 0}E ${infoLocal?.pp ?? 0}P, GF:${infoLocal?.gf ?? 0} GC:${infoLocal?.gc ?? 0}
- ${partido.equipoVisitante.nombre}: Posición ${infoVisitante?.posicion ?? 'N/A'}, ${infoVisitante?.pts ?? 0} pts, ${infoVisitante?.pg ?? 0}G ${infoVisitante?.pe ?? 0}E ${infoVisitante?.pp ?? 0}P, GF:${infoVisitante?.gf ?? 0} GC:${infoVisitante?.gc ?? 0}

PLANTILLA ${partido.equipoLocal.nombre}:
${jugLocal.map(j => `- ${j.nombre} ${j.apellido} (${j.posicion})`).join('\n')}

PLANTILLA ${partido.equipoVisitante.nombre}:
${jugVisitante.map(j => `- ${j.nombre} ${j.apellido} (${j.posicion})`).join('\n')}

Responde SOLO con este JSON exacto, sin texto extra ni markdown:
{
  "probLocal": 45,
  "probEmpate": 25,
  "probVisitante": 30,
  "jugadoresClaveLocal": ["Nombre Apellido", "Nombre Apellido"],
  "jugadoresClaveVisitante": ["Nombre Apellido", "Nombre Apellido"],
  "analisis": "Análisis breve de 2-3 oraciones sobre el partido, mencionando factores clave como posición en tabla, ventaja de local, y jugadores destacados."
}`

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6,
          max_tokens: 500,
        }),
      })

      const data = await res.json()
      const text = data.choices?.[0]?.message?.content?.trim()
      if (!text) throw new Error('Respuesta vacía de la IA')

      // Limpia por si acaso viene con ```json
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setPrediccion(parsed)

    } catch (err) {
      console.error('Error predicción:', err)
      setError('No se pudo generar la predicción. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      marginTop: '2rem',
      padding: '1.5rem',
      background: '#f8f9fa',
      borderRadius: '12px',
      border: '2px solid #e2e8f0',
    }}>
      <h2 style={{ marginBottom: '1rem' }}>🤖 Predicción IA</h2>

      {!prediccion && !loading && (
        <div>
          <p style={{ color: '#718096', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Análisis generado con IA basado en posiciones reales, plantillas y estadísticas del torneo.
          </p>
          <button className="btn btn-primary" onClick={generarPrediccion}>
            ✨ Generar predicción
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '1rem', color: '#718096' }}>
          <p>🧠 Analizando el partido...</p>
        </div>
      )}

      {error && (
        <div>
          <p style={{ color: '#e53e3e', marginBottom: '0.5rem' }}>{error}</p>
          <button className="btn btn-secondary" onClick={generarPrediccion}>Reintentar</button>
        </div>
      )}

      {prediccion && (
        <div>
          {/* Barras de probabilidad */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{
              flex: prediccion.probLocal,
              textAlign: 'center',
              background: '#1a1a2e',
              color: 'white',
              borderRadius: '8px',
              padding: '1rem 0.5rem',
            }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{prediccion.probLocal}%</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{partido.equipoLocal.nombre}</div>
            </div>
            <div style={{
              flex: prediccion.probEmpate,
              textAlign: 'center',
              background: '#4a5568',
              color: 'white',
              borderRadius: '8px',
              padding: '1rem 0.5rem',
            }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{prediccion.probEmpate}%</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Empate</div>
            </div>
            <div style={{
              flex: prediccion.probVisitante,
              textAlign: 'center',
              background: '#1a1a2e',
              color: 'white',
              borderRadius: '8px',
              padding: '1rem 0.5rem',
            }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{prediccion.probVisitante}%</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{partido.equipoVisitante.nombre}</div>
            </div>
          </div>

          {/* Jugadores clave */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                ⭐ Clave — {partido.equipoLocal.nombre}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#4a5568' }}>
                {prediccion.jugadoresClaveLocal?.map(j => <li key={j}>{j}</li>)}
              </ul>
            </div>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                ⭐ Clave — {partido.equipoVisitante.nombre}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#4a5568' }}>
                {prediccion.jugadoresClaveVisitante?.map(j => <li key={j}>{j}</li>)}
              </ul>
            </div>
          </div>

          {/* Análisis */}
          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '8px',
            borderLeft: '4px solid #1a1a2e',
            marginBottom: '1rem',
          }}>
            <p style={{ margin: 0, fontStyle: 'italic', color: '#4a5568', fontSize: '0.9rem' }}>
              💬 {prediccion.analisis}
            </p>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: '0.5rem' }}>
            * Predicción generada por IA. No representa resultados reales.
          </p>
          <button className="btn btn-secondary" onClick={generarPrediccion}>
            🔄 Nueva predicción
          </button>
        </div>
      )}
    </div>
  )
}