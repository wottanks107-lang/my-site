'use client'
import dynamic from 'next/dynamic'

// three.js весит много, поэтому догружаем его отдельным чанком после гидратации,
// а не тянем в первую загрузку страницы. Сам Hero3D внутри ещё и не запускается
// на узких экранах и при prefers-reduced-motion.
const Hero3D = dynamic(() => import('./Hero3D'), { ssr: false })

export default function HeroOrb() {
  return (
    <div className="hero-orb">
      <Hero3D />
    </div>
  )
}
