'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
// Матовая геометрическая форма. Не рендерится на мобильных и при reduced-motion.
export default function Hero3D() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current!
    if (innerWidth < 860 || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    r.setPixelRatio(Math.min(devicePixelRatio, 2)); el.appendChild(r.domElement)
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 1, 0.1, 50); cam.position.z = 5
    const g = new THREE.IcosahedronGeometry(1.5, 1)
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.35, flatShading: true }))
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0xe5202e }))); sc.add(m)
    sc.add(new THREE.AmbientLight(0xffffff, 0.5)); const l = new THREE.PointLight(0xffffff, 60, 20); l.position.set(3, 3, 4); sc.add(l)
    const size = () => { const b = el.getBoundingClientRect(); r.setSize(b.width, b.height); cam.aspect = b.width / b.height; cam.updateProjectionMatrix() }
    size(); addEventListener('resize', size)
    let mx = 0, my = 0, id = 0
    const mv = (e: MouseEvent) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5 }
    addEventListener('mousemove', mv)
    const tick = () => { m.rotation.y += 0.003; m.rotation.x += (my * 0.8 - m.rotation.x) * 0.02; m.position.x += (mx * 0.6 - m.position.x) * 0.03; r.render(sc, cam); id = requestAnimationFrame(tick) }
    tick()
    return () => { cancelAnimationFrame(id); removeEventListener('resize', size); removeEventListener('mousemove', mv); g.dispose(); r.dispose(); r.domElement.remove() }
  }, [])
  return <div ref={ref} aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
}
