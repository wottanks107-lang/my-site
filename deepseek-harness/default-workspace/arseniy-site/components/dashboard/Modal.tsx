'use client'
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/**
 * Модальное окно для форм и подтверждений.
 * Закрывается по Escape и по клику вне окна, блокирует прокрутку страницы.
 */
export default function Modal({
  open, title, onClose, children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Фокус в первое поле — удобно, когда форма открывается с клавиатуры.
    const timer = window.setTimeout(() => {
      ref.current?.querySelector<HTMLElement>('input:not([type=hidden]),textarea,select,button')?.focus()
    }, 30)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
      window.clearTimeout(timer)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-scrim"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="modal-head">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">
            <X size={16} aria-hidden />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
