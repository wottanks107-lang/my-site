import { readableError } from './repositories/errors'

export type Safe<T> = { data: T; error: string | null }

/**
 * Загружает данные, не роняя страницу при ошибке.
 *
 * Нужно для dashboard: если база недоступна или миграции не выполнены,
 * пользователь увидит понятное сообщение, а не пустой экран с ошибкой.
 */
export async function safe<T>(load: () => Promise<T>, fallback: T): Promise<Safe<T>> {
  try {
    return { data: await load(), error: null }
  } catch (error) {
    return { data: fallback, error: readableError(error) }
  }
}

/** Первая непустая ошибка из набора результатов. */
export function firstError(...results: Safe<unknown>[]): string | null {
  for (const result of results) if (result.error) return result.error
  return null
}
