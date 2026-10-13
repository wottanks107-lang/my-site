'use client'
// Интерактивный фон: сетка и световые пятна на CSS, частицы и spotlight на canvas.
//
// Ограничения по производительности:
//   • количество частиц зависит от ширины экрана (на телефоне 14, на десктопе 46);
//   • плотность пикселей не выше 2, чтобы не грузить GPU на retina;
//   • на паузе при скрытой вкладке;
//   • при prefers-reduced-motion canvas не запускается вообще;
//   • строки стилей берутся из готовой палитры, чтобы не мусорить в GC каждый кадр.
import { useEffect, useRef } from 'react'

type Particle = { x: number; y: number; vx: number; vy: number; r: number }

const LINK_DISTANCE = 15000 // квадрат расстояния ~122px
const LINK_STYLES = [
  'rgba(255,255,255,0.03)',
  'rgba(255,255,255,0.06)',
  'rgba(255,255,255,0.09)',
  'rgba(255,255,255,0.12)',
  'rgba(255,255,255,0.15)',
]
const DOT_STYLE = 'rgba(255,255,255,0.45)'

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let particles: Particle[] = []
    let frame = 0
    let spot: CanvasGradient | null = null
    const mouse = { x: 0, y: 0, active: false }

    const particleCount = () => {
      if (innerWidth < 640) return 14
      if (innerWidth < 1024) return 26
      return 46
    }

    const buildParticles = () => {
      const total = particleCount()
      particles = Array.from({ length: total }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() * 1.5 + 0.6,
      }))
    }

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      if (!width || !height) return
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildParticles()
    }

    const buildSpot = () => {
      spot = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 260)
      spot.addColorStop(0, 'rgba(229,32,46,0.10)')
      spot.addColorStop(0.5, 'rgba(229,32,46,0.035)')
      spot.addColorStop(1, 'rgba(229,32,46,0)')
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      if (mouse.active && spot) {
        ctx.fillStyle = spot
        ctx.fillRect(mouse.x - 260, mouse.y - 260, 520, 520)
      }

      ctx.lineWidth = 1
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < LINK_DISTANCE) {
            ctx.strokeStyle = LINK_STYLES[Math.min(4, Math.floor((1 - d2 / LINK_DISTANCE) * 5))]
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      ctx.fillStyle = DOT_STYLE
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        // частицы рядом с курсором мягко отклоняются
        if (mouse.active) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const d2 = dx * dx + dy * dy
          if (d2 < 16000 && d2 > 1) {
            const force = (1 - d2 / 16000) * 0.9
            const distance = Math.sqrt(d2)
            p.x += (dx / distance) * force
            p.y += (dy / distance) * force
          }
        }

        if (p.x < -20) p.x = width + 20
        else if (p.x > width + 20) p.x = -20
        if (p.y < -20) p.y = height + 20
        else if (p.y > height + 20) p.y = -20

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      frame = requestAnimationFrame(draw)
    }

    let resizeFrame = 0
    const onResize = () => {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(resize)
    }

    const onMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX
      mouse.y = event.clientY
      mouse.active = true
      buildSpot()
    }

    const onMouseLeave = () => {
      mouse.active = false
      spot = null
    }

    const onVisibility = () => {
      cancelAnimationFrame(frame)
      if (!document.hidden) frame = requestAnimationFrame(draw)
    }

    resize()
    buildSpot()
    frame = requestAnimationFrame(draw)
    addEventListener('resize', onResize, { passive: true })
    addEventListener('mousemove', onMouseMove, { passive: true })
    addEventListener('mouseout', onMouseLeave, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(resizeFrame)
      removeEventListener('resize', onResize)
      removeEventListener('mousemove', onMouseMove)
      removeEventListener('mouseout', onMouseLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div className="bg" aria-hidden>
      <div className="bg-grid" />
      <div className="bg-glow a" />
      <div className="bg-glow b" />
      <div className="bg-glow c" />
      <canvas ref={canvasRef} className="bg-canvas" />
    </div>
  )
}
