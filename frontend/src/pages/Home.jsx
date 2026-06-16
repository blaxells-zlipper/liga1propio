import { Link } from 'react-router-dom'
import { Hero } from '../components/Hero'
import { ProximosPartidos } from '../components/ProximosPartidos'
import { UltimosResultados } from '../components/UltimosResultados'
import { NoticiasFavoritas } from '../components/NoticiasFavoritas'
import '../styles/Home.css'

export function Home() {
  return (
    <section className="home-page">
      <Hero />
      <main className="main-content">
        <ProximosPartidos />
        <UltimosResultados />
        <NoticiasFavoritas />
      </main>
    </section>
  )
}