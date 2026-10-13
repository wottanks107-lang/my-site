// Базовый набор операций для простых справочных таблиц.
//
// Даёт одинаковый CRUD для соцсетей, таймлайна, навыков, проектов, книг,
// расписания, ДЗ, заметок, целей, тренировок и финансов. Таблицы со связями
// (задачи, чеклисты, упражнения) дополняются в своих файлах.
import { adminClient, readClient } from '../supabase/client'
import { DataError, many, maybeOne, nothing, one } from './errors'

export type Row = { id: string }

export type Order = { column: string; ascending?: boolean }

export type RepoOptions = {
  /** Сортировка по умолчанию. */
  order?: Order[]
  /**
   * Колонка-флаг публичности. null — таблица полностью приватная,
   * и listPublic() намеренно бросает ошибку.
   */
  publicColumn?: string | null
}

export type Repo<T extends Row> = {
  table: string
  /** Все строки — для dashboard. Использует service_role. */
  list: () => Promise<T[]>
  /** Только публичные строки — для сайта. Идёт через anon-ключ и RLS. */
  listPublic: () => Promise<T[]>
  get: (id: string) => Promise<T | null>
  create: (input: Record<string, unknown>) => Promise<T>
  update: (id: string, patch: Record<string, unknown>) => Promise<T>
  remove: (id: string) => Promise<void>
}

// PostgREST-билдер типизирован очень широко, поэтому здесь намеренно any:
// строгие типы строк задаются на уровне предметных функций.
/* eslint-disable @typescript-eslint/no-explicit-any */

export function createRepo<T extends Row>(table: string, options: RepoOptions = {}): Repo<T> {
  const orders = options.order ?? [{ column: 'sort_order' }, { column: 'created_at' }]
  const publicColumn = options.publicColumn === undefined ? 'is_public' : options.publicColumn

  const sorted = (query: any) =>
    orders.reduce((acc, o) => acc.order(o.column, { ascending: o.ascending ?? true }), query)

  return {
    table,

    list: () => many<T>(table, sorted(adminClient().from(table).select('*'))),

    listPublic: () => {
      if (!publicColumn) throw new DataError(`${table}: публичный доступ не предусмотрен`)
      return many<T>(table, sorted(readClient().from(table).select('*').eq(publicColumn, true)))
    },

    get: (id: string) => maybeOne<T>(table, adminClient().from(table).select('*').eq('id', id).limit(1)),

    create: (input: Record<string, unknown>) =>
      one<T>(table, adminClient().from(table).insert(input).select().single()),

    update: (id: string, patch: Record<string, unknown>) =>
      one<T>(table, adminClient().from(table).update(patch).eq('id', id).select().single()),

    remove: (id: string) => nothing(table, adminClient().from(table).delete().eq('id', id)),
  }
}

/** Заменить набор дочерних строк целиком (задачи проекта, чеклист ДЗ и т.п.). */
export async function replaceChildren(
  table: string,
  foreignKey: string,
  parentId: string,
  rows: Record<string, unknown>[],
): Promise<void> {
  const db = adminClient()
  await nothing(table, db.from(table).delete().eq(foreignKey, parentId))
  if (!rows.length) return
  await nothing(table, db.from(table).insert(rows.map((r, i) => ({ ...r, [foreignKey]: parentId, sort_order: i }))))
}
