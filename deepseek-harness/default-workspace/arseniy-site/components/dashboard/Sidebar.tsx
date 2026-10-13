'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowLeft, BookOpen, CalendarDays, Dumbbell, FolderKanban, LayoutDashboard,
  LogOut, Menu, NotebookPen, Settings, StickyNote, Target, UserRound, X,
} from 'lucide-react'

const LINKS = [
  { href: '/dashboard', label: 'Обзор', icon: LayoutDashboard },
  { href: '/dashboard/schedule', label: 'Расписание', icon: CalendarDays },
  { href: '/dashboard/homework', label: 'ДЗ', icon: NotebookPen },
  { href: '/dashboard/notes', label: 'Заметки', icon: StickyNote },
  { href: '/dashboard/projects', label: 'Проекты', icon: FolderKanban },
  { href: '/dashboard/goals', label: 'Цели', icon: Target },
  { href: '/dashboard/workouts', label: 'Тренировки', icon: Dumbbell },
  { href: '/dashboard/books', label: 'Книги', icon: BookOpen },
  { href: '/dashboard/profile', label: 'Профиль', icon: UserRound },
  { href: '/dashboard/settings', label: 'Настройки', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Меню закрывается при переходе между разделами.
  useEffect(() => { setOpen(false) }, [pathname])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }

  return (
    <>
      <aside className={'dash-side' + (open ? ' open' : '')}>
        <div className="dash-brand">PERSONAL<span> OS</span></div>

        <nav className="dash-nav" aria-label="Разделы dashboard">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={'dash-link' + (pathname === href ? ' on' : '')}
              aria-current={pathname === href ? 'page' : undefined}
            >
              <Icon size={17} aria-hidden /> {label}
            </Link>
          ))}
        </nav>

        <div className="dash-side-foot">
          <Link href="/" className="dash-link"><ArrowLeft size={17} aria-hidden /> На сайт</Link>
          <button type="button" className="dash-link" onClick={logout}>
            <LogOut size={17} aria-hidden /> Выйти
          </button>
        </div>
      </aside>

      {open && <button type="button" className="dash-scrim" aria-label="Закрыть меню" onClick={() => setOpen(false)} />}

      <button
        type="button"
        className="btn sm dash-burger"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        {open ? <X size={15} aria-hidden /> : <Menu size={15} aria-hidden />} Меню
      </button>
    </>
  )
}
