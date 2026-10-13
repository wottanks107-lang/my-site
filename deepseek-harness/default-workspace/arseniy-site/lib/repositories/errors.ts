// Единая обработка ошибок доступа к данным.
//
// Наружу (в браузер) уходит только понятное сообщение вида «projects: …»,
// без stack trace. Технические детали остаются в логах сервера.

export class DataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DataError'
  }
}

type Res<T> = { data: T | null; error: { message: string } | null }

/** Ожидает список строк. */
export async function many<T>(table: string, query: PromiseLike<Res<T[]>>): Promise<T[]> {
  const { data, error } = await query
  if (error) throw new DataError(`${table}: ${error.message}`)
  return data ?? []
}

/** Ожидает ровно одну строку. */
export async function one<T>(table: string, query: PromiseLike<Res<T>>): Promise<T> {
  const { data, error } = await query
  if (error) throw new DataError(`${table}: ${error.message}`)
  if (data === null) throw new DataError(`${table}: запись не найдена`)
  return data
}

/** Ожидает 0 или 1 строку — для поиска по slug или id. */
export async function maybeOne<T>(table: string, query: PromiseLike<Res<T[]>>): Promise<T | null> {
  const rows = await many<T>(table, query)
  return rows[0] ?? null
}

/** Для операций без возвращаемых данных (delete, upsert). */
export async function nothing(table: string, query: PromiseLike<Res<unknown>>): Promise<void> {
  const { error } = await query
  if (error) throw new DataError(`${table}: ${error.message}`)
}

/** Понятный текст для показа владельцу. */
export const readableError = (error: unknown): string =>
  error instanceof DataError ? error.message : 'Не удалось обратиться к данным'
