'use client'
import { useRef } from 'react'
import { useToast } from './Toast'
import type { ActionState } from '@/lib/actions/types'

/**
 * Форма, которая вызывает серверный экшен и сама показывает результат.
 *
 * Нужна потому, что встроенный `action` формы ожидает функцию без результата,
 * а наши экшены возвращают ActionState — чтобы показать понятную ошибку.
 */
export default function ActionForm({
  action, className, style, children, successMessage, resetOnSuccess,
}: {
  action: (formData: FormData) => Promise<ActionState>
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
  successMessage?: string
  resetOnSuccess?: boolean
}) {
  const toast = useToast()
  const ref = useRef<HTMLFormElement>(null)

  return (
    <form
      ref={ref}
      className={className}
      style={style}
      action={async (formData: FormData) => {
        const result = await action(formData)
        if (result.ok) {
          if (successMessage) toast(successMessage)
          if (resetOnSuccess) ref.current?.reset()
        } else {
          toast(result.error ?? 'Не удалось выполнить', 'error')
        }
      }}
    >
      {children}
    </form>
  )
}
