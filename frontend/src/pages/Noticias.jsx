import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { favoritoService } from '../services/apiService'

export function Noticias() {
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('todas')
  const [equipoFavorito, setEquipoFavorito] = useState(null)

  useEffect(() => {
    const loadFavorito = async () => {
      if (user?.id) {
        try {
          const res = await favoritoService.get(user.id)
          if (res.data?.nombre) {
            setEquipoFavorito(res.data.nombre)
          }
        } catch (error) {
          console.error('Error cargando favorito:', error)
        }
      }
    }
    loadFavorito()
  }, [user])

  const categories = [
    { id: 'todas', label: 'Todas' },
    { id: 'resultados', label: 'Resultados' },
    { id: 'fichajes', label: 'Fichajes' },
    { id: 'previa', label: 'Previa' },
    { id: 'estadisticas', label: 'Estadísticas' },
    { id: 'noticias', label: 'Noticias' }
  ]

  const noticias = [
    {
      id: 1,
      categoria: 'resultados',
      equipo: 'Universitario',
      titulo: 'Universitario se mantiene en la cima tras vencer a Sport Boys',
      descripcion: 'Los cremas lograron una importante victoria de visitante que los consolida como líderes del torneo.',
      tiempo: 'Hace 2 horas',
      imagen: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop',
      destacada: true
    },
    {
      id: 2,
      categoria: 'fichajes',
      equipo: 'Alianza Lima',
      titulo: 'Alianza Lima prepara refuerzos para el Clausura',
      descripcion: 'La dirigencia blanquiazul trabaja en incorporaciones para mantener el ritmo en la segunda mitad del...',
      tiempo: 'Hace 5 horas',
      imagen: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=400&fit=crop'
    },
    {
      id: 3,
      categoria: 'previa',
      equipo: 'FBC Melgar',
      titulo: 'Melgar busca mantener su invicto en casa ante Sporting Cristal',
      descripcion: 'El equipo arequipeño no conoce la derrota como local y buscará extender su racha este fin de...',
      tiempo: 'Hace 8 horas',
      imagen: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&h=400&fit=crop'
    },
    {
      id: 4,
      categoria: 'estadisticas',
      equipo: 'Universitario',
      titulo: 'La tabla de goleadores se aprieta en la Liga 1',
      descripcion: 'Alex Valera lidera con 8 goles, pero varios delanteros están cerca de alcanzarlo.',
      tiempo: 'Hace 12 horas',
      imagen: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=600&h=400&fit=crop'
    },
    {
      id: 5,
      categoria: 'noticias',
      equipo: 'Sport Boys',
      titulo: 'Sport Boys ficha a joven promesa del fútbol peruano',
      descripcion: 'El club rosado anunció la llegada de un talentoso lateral izquierdo para reforzar su defensa.',
      tiempo: 'Hace 15 horas',
      imagen: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=400&fit=crop'
    },
    {
      id: 6,
      categoria: 'resultados',
      equipo: 'Sporting Cristal',
      titulo: 'Cristal cae en sorpresivo resultado',
      descripcion: 'Los cerveceros no pudieron cerrar el partido en un encuentro lleno de emociones.',
      tiempo: 'Hace 18 horas',
      imagen: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=600&h=400&fit=crop'
    },
    {
      id: 7,
      categoria: 'fichajes',
      equipo: 'Universitario',
      titulo: 'Universitario evalúa incorporar un nuevo central para el Clausura',
      descripcion: 'La dirección deportiva crema busca reforzar la zaga defensiva de cara a la siguiente etapa del torneo.',
      tiempo: 'Hace 20 horas',
      imagen: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&h=400&fit=crop'
    },
    {
      id: 8,
      categoria: 'previa',
      equipo: 'Cienciano',
      titulo: 'Cienciano se prepara para un duelo clave en el Cusco',
      descripcion: 'El equipo imperial llega motivado tras su último resultado y buscará seguir sumando puntos en casa.',
      tiempo: 'Hace 22 horas',
      imagen: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&h=400&fit=crop'
    },
  ]

  const noticiaDestacada = noticias.find(n => n.destacada)

  let noticiasFiltradas = noticias.filter(n => !n.destacada)

  if (selectedCategory !== 'todas') {
    noticiasFiltradas = noticiasFiltradas.filter(n => n.categoria === selectedCategory)
  }

  if (equipoFavorito) {
    noticiasFiltradas = [...noticiasFiltradas].sort((a, b) => {
      const aFav = a.equipo === equipoFavorito ? 0 : 1
      const bFav = b.equipo === equipoFavorito ? 0 : 1
      return aFav - bFav
    })
  }

  return (
    <section className="noticias-section">
      <div className="noticias-header">
        <h1>📰 Noticias</h1>
        {equipoFavorito && (
          <p className="section-description">Mostrando primero noticias de {equipoFavorito} ❤️</p>
        )}
      </div>

      <div className="noticias-tabs">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`tab-button ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {noticiaDestacada && (selectedCategory === 'todas' || noticiaDestacada.categoria === selectedCategory) && (
        <article className="noticia-destacada">
          <img src={noticiaDestacada.imagen} alt={noticiaDestacada.titulo} className="noticia-imagen" />
          <div className="noticia-destacada-content">
            <div className="noticia-badges">
              <span className={`noticia-badge badge-${noticiaDestacada.categoria}`}>
                {noticiaDestacada.equipo} • {noticiaDestacada.categoria.charAt(0).toUpperCase() + noticiaDestacada.categoria.slice(1)}
              </span>
              <span className="noticia-tiempo">
                ⏱️ {noticiaDestacada.tiempo}
              </span>
            </div>
            <h2 className="noticia-destacada-titulo">{noticiaDestacada.titulo}</h2>
            <p className="noticia-destacada-descripcion">{noticiaDestacada.descripcion}</p>
          </div>
        </article>
      )}

      <div className="noticias-grid">
        {noticiasFiltradas.map(noticia => (
          <article key={noticia.id} className={`noticia-card ${noticia.equipo === equipoFavorito ? 'noticia-favorita' : ''}`}>
            <img src={noticia.imagen} alt={noticia.titulo} className="noticia-imagen" />
            <div className="noticia-body">
              <div className="noticia-badges">
                <span className={`noticia-badge badge-${noticia.categoria}`}>
                  {noticia.equipo === equipoFavorito && '❤️ '}{noticia.equipo} • {noticia.categoria.charAt(0).toUpperCase() + noticia.categoria.slice(1)}
                </span>
                <span className="noticia-tiempo">
                  ⏱️ {noticia.tiempo}
                </span>
              </div>
              <h3 className="noticia-titulo">{noticia.titulo}</h3>
              <p className="noticia-descripcion">{noticia.descripcion}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}