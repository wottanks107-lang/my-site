/** Результат серверного экшена, который возвращается в форму. */
export type ActionState = { ok: boolean; error: string | null }

export const IDLE: ActionState = { ok: false, error: null }

export const DENIED: ActionState = { ok: false, error: 'Нужно войти в dashboard заново' }

/** Читает строку из формы и обрезает пробелы. */
export function str(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

/** Читает строку, пустая превращается в null. */
export function nullable(formData: FormData, key: string): string | null {
  const value = str(formData, key)
  return value === '' ? null : value
}

/** Целое число в заданных границах. */
export function boundedInt(formData: FormData, key: string, min: number, max: number, fallback = 0): number {
  const value = Number(formData.get(key))
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

export const checked = (formData: FormData, key: string): boolean => formData.get(key) === 'on'

/** Список строк из строки с разделителями. */
export function splitList(value: string): string[] {
  return value.split(/[,\n]/).map(item => item.trim()).filter(Boolean)
}

export const message = (error: unknown, fallback = 'Не удалось сохранить'): string =>
  error instanceof Error ? error.message : fallback
