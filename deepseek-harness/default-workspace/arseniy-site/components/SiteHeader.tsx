'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const LINKS = [
  { href: '/projects', label: 'Проекты' },
  { href: '/#now', label: 'Сейчас' },
  { href: '/#about', label: 'Обо мне' },
  { href: '/#contacts', label: 'Контакты' },
]

export default function SiteHeader({ admin, name }: { admin: boolean; name: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 12)
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])

  // Меню закрывается при переходе на другую страницу.
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <header className={'site-header' + (scrolled ? ' scrolled' : '')}>
      <div className="inner">
        <Link href="/" className="brand" aria-label="На главную">
          {name.toUpperCase()}<span>.</span>
        </Link>

        <nav className={'nav-links' + (open ? ' open' : '')} aria-label="Основная навигация">
          {LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Link href={admin ? '/admin' : '/login'} className="btn sm ghost">
            {admin ? 'Панель' : 'Войти'}
          </Link>
        </nav>

        <button
          type="button"
          className="nav-burger btn sm"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen(value => !value)}
        >
          {open ? 'Закрыть' : 'Меню'}
        </button>
      </div>
    </header>
  )
}
