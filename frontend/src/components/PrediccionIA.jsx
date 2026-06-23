import { useEffect, useState } from 'react'
import { partidoService } from '../services/apiService'
import { TrendingUp, Users } from 'lucide-react'

const ProgressBar = ({ value, className = '' }) => (
  <div className={`h-2 w-full overflow-hidden rounded-full bg-white/10 ${className}`}>
    <div
      className="h-full rounded-full bg-gradient-to-r from-red-500 via-rose-500 to-orange-400"
      style={{ width: `${value}%` }}
    />
  </div>
)

export function PrediccionIA({ partido }) {
  const [prediccion, setPrediccion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await partidoService.getPrediccion(partido.id)
        if (isMounted) {
          setPrediccion(response.data)
        }
      } catch (err) {
        console.error('Error cargando prediccion:', err)
        if (isMounted) {
          setError('No se pudo calcular la prediccion en este momento.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [partido.id])

  const barras = prediccion
    ? [
        { label: partido.equipoLocal.nombre, value: prediccion.probLocal },
        { label: 'Empate', value: prediccion.probEmpate },
        { label: partido.equipoVisitante.nombre, value: prediccion.probVisitante },
      ]
    : []

  return (
    <div className="glass-panel mt-8 p-6" aria-live="polite">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 inline-flex rounded-full border-2 border-white bg-brand-softer px-3 py-1 text-xs font-bold uppercase text-brand-strong">
            Prediccion
          </p>
          <h2 className="text-3xl text-white">Prediccion del partido</h2>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border-2 border-white bg-neutral-secondary-medium p-5 text-center text-heading shadow-[var(--shadow-sm)]">
          <p className="font-semibold">Calculando probabilidades con ultimos partidos, jugadores y cruces directos...</p>
        </div>
      )}

      {error && !loading && (
        <div role="alert" className="rounded-2xl border-2 border-white bg-danger p-5 text-white shadow-[var(--shadow-sm)]">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {!loading && prediccion && !error && (
        <div>
          <div className="mb-6 grid gap-3 md:grid-cols-3">
            {barras.map((item) => (
              <article
                key={item.label}
                className="rounded-2xl border-2 border-white bg-neutral-secondary-medium p-4 text-white shadow-[var(--shadow-sm)]"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-bold">{item.label}</p>
                  <p className="text-3xl font-display">{item.value}%</p>
                </div>
                <ProgressBar value={item.value} />
              </article>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border-2 border-white bg-neutral-secondary-medium p-4 text-heading shadow-[var(--shadow-sm)]">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg text-white">Forma reciente</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-sm font-bold text-white">{prediccion.local.nombre}</p>
                  <ProgressBar value={prediccion.local.forma} />
                  <p className="mt-1 text-xs text-text-muted">
                    {prediccion.local.forma}% en los ultimos {prediccion.local.partidosAnalizados} partidos
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-sm font-bold text-white">{prediccion.visitante.nombre}</p>
                  <ProgressBar value={prediccion.visitante.forma} />
                  <p className="mt-1 text-xs text-text-muted">
                    {prediccion.visitante.forma}% en los ultimos {prediccion.visitante.partidosAnalizados} partidos
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border-2 border-white bg-neutral-secondary-medium p-4 text-heading shadow-[var(--shadow-sm)]">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg text-white">Rendimiento de jugadores</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-sm font-bold text-white">{prediccion.local.nombre}</p>
                  <ProgressBar value={prediccion.local.rendimientoJugadores} />
                  <p className="mt-1 text-xs text-text-muted">
                    {prediccion.local.rendimientoJugadores}% promedio de impacto en el tramo reciente
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-sm font-bold text-white">{prediccion.visitante.nombre}</p>
                  <ProgressBar value={prediccion.visitante.rendimientoJugadores} />
                  <p className="mt-1 text-xs text-text-muted">
                    {prediccion.visitante.rendimientoJugadores}% promedio de impacto en el tramo reciente
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      )}
    </div>
  )
}
