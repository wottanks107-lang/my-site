'use client'
// Появление блоков при прокрутке. Анимируются элементы с атрибутом data-reveal.
//
// Важно: начальное состояние задаёт сам GSAP (from), а не CSS. Поэтому если
// скрипт не загрузится, контент останется видимым, а не исчезнет.
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function PageFX() {
  const pathname = usePathname()

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(element => {
        gsap.from(element, {
          y: 34,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 88%' },
        })
      })
    })

    // Пересчёт после подгрузки картинок, иначе триггеры съезжают.
    const refresh = () => ScrollTrigger.refresh()
    addEventListener('load', refresh)

    return () => {
      removeEventListener('load', refresh)
      ctx.revert()
    }
  }, [pathname])

  return null
}
