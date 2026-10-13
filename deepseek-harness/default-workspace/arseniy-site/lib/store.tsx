'use client'
// Контент сайта на стороне браузера.
//
// Данные приходят уже отрисованными с сервера (initial), затем один раз
// перечитываются из /api/content, чтобы правки из админки были видны сразу.
// Сохранение уходит на сервер в data/content.json.
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Content, Id, Key, Rows } from './schema'

export * from './schema'

type Status = 'idle' | 'saving' | 'saved' | 'error'
type Store = {
  data: Content
  admin: boolean
  status: Status
  error: string
  save: (key: Key, rows: Rows[]) => Promise<boolean>
}

const Ctx = createContext<Store | null>(null)

export function ContentProvider({ initial, admin, children }: { initial: Content; admin: boolean; children: React.ReactNode }) {
  const [data, setData] = useState<Content>(initial)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    fetch('/api/content', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((j: Content | null) => { if (alive && j && typeof j === 'object') setData(j) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const save = useCallback(async (key: Key, rows: Rows[]) => {
    setData(d => ({ ...d, [key]: rows }))   // сразу показываем, потом сохраняем
    setStatus('saving'); setError('')
    try {
      const r = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, rows }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j?.error || 'Сервер отказал в сохранении')
      setStatus('saved')
      setTimeout(() => setStatus(s => (s === 'saved' ? 'idle' : s)), 2500)
      return true
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Ошибка сети')
      return false
    }
  }, [])

  return <Ctx.Provider value={{ data, admin, status, error, save }}>{children}</Ctx.Provider>
}

function useStore(): Store {
  const c = useContext(Ctx)
  if (!c) throw new Error('ContentProvider не подключён')
  return c
}

/** Заменяет прежний localStorage-хук: тот же интерфейс [данные, сохранить]. */
export function useCol<T extends Id>(key: Key): [T[], (v: T[]) => void] {
  const { data, save } = useStore()
  const rows = (data?.[key] ?? []) as unknown as T[]
  const set = useCallback((v: T[]) => { void save(key, v as unknown as Rows[]) }, [save, key])
  return [rows, set]
}

/** Состояние сохранения — для индикатора в админке. */
export const useSaveStatus = () => {
  const { status, error } = useStore()
  return { status, error }
}

/** Вошёл ли владелец — от этого зависят кнопки, которые пишут данные. */
export const useIsAdmin = () => useStore().admin
