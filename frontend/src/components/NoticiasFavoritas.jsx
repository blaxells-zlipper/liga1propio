import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { favoritoService } from '../services/apiService'
import '../styles/NoticiasFavoritas.css'

const noticias = [
  {
    id: 1,
    categoria: 'resultados',
    equipo: 'Universitario',
    titulo: 'Universitario se mantiene en la cima tras vencer a Sport Boys',
    tiempo: 'Hace 2 horas',
    imagen: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop',
  },
  {
    id: 2,
    categoria: 'fichajes',
    equipo: 'Alianza Lima',
    titulo: 'Alianza Lima prepara refuerzos para el Clausura',
    tiempo: 'Hace 5 horas',
    imagen: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=250&fit=crop',
  },
  {
    id: 3,
    categoria: 'previa',
    equipo: 'FBC Melgar',
    titulo: 'Melgar busca mantener su invicto en casa ante Sporting Cristal',
    tiempo: 'Hace 8 horas',
    imagen: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&h=250&fit=crop',
  },
  {
    id: 4,
    categoria: 'estadisticas',
    equipo: 'Universitario',
    titulo: 'La tabla de goleadores se aprieta en la Liga 1',
    tiempo: 'Hace 12 horas',
    imagen: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=400&h=250&fit=crop',
  },
  {
    id: 5,
    categoria: 'noticias',
    equipo: 'Sport Boys',
    titulo: 'Sport Boys ficha a joven promesa del fútbol peruano',
    tiempo: 'Hace 15 horas',
    imagen: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=250&fit=crop',
  },
  {
    id: 6,
    categoria: 'resultados',
    equipo: 'Sporting Cristal',
    titulo: 'Cristal cae en sorpresivo resultado',
    tiempo: 'Hace 18 horas',
    imagen: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400&h=250&fit=crop',
  },
  {
    id: 7,
    categoria: 'fichajes',
    equipo: 'Universitario',
    titulo: 'Universitario evalúa incorporar un nuevo central para el Clausura',
    tiempo: 'Hace 20 horas',
    imagen: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=250&fit=crop',
  },
  {
    id: 8,
    categoria: 'previa',
    equipo: 'Cienciano',
    titulo: 'Cienciano se prepara para un duelo clave en el Cusco',
    tiempo: 'Hace 22 horas',
    imagen: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=250&fit=crop',
  },
]

export function NoticiasFavoritas() {
  const { user } = useAuth()
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

  const noticiasDestacadas = equipoFavorito
    ? noticias.filter(n => n.equipo === equipoFavorito).slice(0, 2)
    : noticias.slice(0, 2)

  if (noticiasDestacadas.length === 0) return null

  return (
    <section className="noticias-favoritas">
      <div className="noticias-favoritas-header">
        <h2>
          {equipoFavorito ? `📰 Noticias de ${equipoFavorito}` : '📰 Últimas Noticias'}
        </h2>
        <Link to="/noticias" className="ver-todos">Ver todas →</Link>
      </div>
      <div className="noticias-favoritas-grid">
        {noticiasDestacadas.map((noticia) => (
          <Link key={noticia.id} to="/noticias" className="noticia-favorita-card">
            <img src={noticia.imagen} alt={noticia.titulo} className="noticia-favorita-imagen" />
            <div className="noticia-favorita-body">
              <span className="noticia-favorita-tiempo">⏱️ {noticia.tiempo}</span>
              <h3>{noticia.titulo}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}