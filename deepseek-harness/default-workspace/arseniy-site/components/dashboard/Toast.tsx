'use client'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CircleCheck, X } from 'lucide-react'

type Kind = 'ok' | 'error'
type Push = (message: string, kind?: Kind) => void

const ToastContext = createContext<Push>(() => {})

/** Показать всплывающее сообщение: const toast = useToast(); toast('Сохранено') */
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: number; message: string; kind: Kind }[]>([])

  const push = useCallback<Push>((message, kind = 'ok') => {
    const id = Date.now() + Math.random()
    setItems(list => [...list, { id, message, kind }])
    window.setTimeout(() => setItems(list => list.filter(item => item.id !== id)), 3400)
  }, [])

  const value = useMemo(() => push, [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map(item => (
          <div key={item.id} className={'toast ' + item.kind}>
            {item.kind === 'ok'
              ? <CircleCheck size={16} aria-hidden style={{ color: '#2ECC71', flex: 'none' }} />
              : <X size={16} aria-hidden style={{ color: 'var(--red)', flex: 'none' }} />}
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
