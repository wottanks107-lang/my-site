'use client'
// Курсор: маленькая точка идёт точно за мышью, кольцо догоняет её с задержкой
// и увеличивается над интерактивными элементами.
//
// Работает только на устройствах с точным указателем. Если JS не выполнится,
// системный курсор останется на месте — класс has-cursor добавляется скриптом.
import { useEffect, useRef } from 'react'

const INTERACTIVE = 'a,button,input,select,textarea,summary,[role="button"],.panel'

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!matchMedia('(pointer:fine)').matches) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let targetX = innerWidth / 2
    let targetY = innerHeight / 2
    let ringX = targetX
    let ringY = targetY
    let frame = 0

    const onMove = (event: MouseEvent) => {
      targetX = event.clientX
      targetY = event.clientY
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`
      ring.classList.toggle('on', Boolean((event.target as HTMLElement | null)?.closest(INTERACTIVE)))
    }

    const onLeave = () => {
      dot.style.opacity = '0'
      ring.style.opacity = '0'
    }

    const onEnter = () => {
      dot.style.opacity = '1'
      ring.style.opacity = '1'
    }

    const tick = () => {
      ringX += (targetX - ringX) * 0.16
      ringY += (targetY - ringY) * 0.16
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`
      frame = requestAnimationFrame(tick)
    }

    document.body.classList.add('has-cursor')
    addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      document.body.classList.remove('has-cursor')
      removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cur-dot" aria-hidden />
      <div ref={ringRef} className="cur-ring" aria-hidden />
    </>
  )
}
