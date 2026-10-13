'use client'
import { useState } from 'react'
import { Trash } from 'lucide-react'
import Modal from './Modal'
import { useToast } from './Toast'
import type { ActionState } from '@/lib/actions/types'

/**
 * Кнопка удаления с обязательным подтверждением.
 * Действие — серверный экшен вида (formData) => ActionState.
 */
export default function ConfirmDelete({
  id, action, title = 'Удалить запись?', description, icon = true, label,
}: {
  id: string
  action: (formData: FormData) => Promise<ActionState>
  title?: string
  description?: string
  icon?: boolean
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  const run = async () => {
    setPending(true)
    setError('')
    const formData = new FormData()
    formData.set('id', id)
    const result = await action(formData)
    setPending(false)
    if (result.ok) {
      setOpen(false)
      toast('Удалено')
    } else {
      setError(result.error ?? 'Не удалось удалить')
    }
  }

  return (
    <>
      <button
        type="button"
        className={icon ? 'icon-btn' : 'btn sm ghost'}
        onClick={() => setOpen(true)}
        aria-label={label ?? 'Удалить'}
      >
        {icon ? <Trash size={15} aria-hidden /> : (label ?? 'Удалить')}
      </button>

      <Modal open={open} title={title} onClose={() => setOpen(false)}>
        <p style={{ marginBottom: 0 }}>{description ?? 'Действие нельзя отменить.'}</p>
        {error && <div className="dash-error" style={{ marginBottom: 0 }}>{error}</div>}
        <div className="modal-foot">
          <button type="button" className="btn ghost sm" onClick={() => setOpen(false)}>Отмена</button>
          <button type="button" className="btn sm" onClick={run} disabled={pending}>
            {pending ? 'Удаляю…' : 'Удалить'}
          </button>
        </div>
      </Modal>
    </>
  )
}
