// Домашние задания: предмет, дедлайн, приоритет, статус, чеклист.
import { adminClient } from '../supabase/client'
import { createRepo, replaceChildren } from './crud'
import { many, nothing, one } from './errors'
import type { Homework, HomeworkChecklistItem, HomeworkStatus } from '../types'

const TABLE = 'homework'
const repo = createRepo<Homework>(TABLE, {
  order: [{ column: 'due_date' }],
  publicColumn: null, // ДЗ приватно
})

export const listHomework = repo.list
export const getHomework = repo.get
export const createHomework = repo.create
export const updateHomework = repo.update
export const removeHomework = repo.remove

export type HomeworkWithChecklist = Homework & { homework_checklist: HomeworkChecklistItem[] }

const todayIso = () => new Date().toISOString().slice(0, 10)

/** Дедлайн вычисляется на чтении: если срок прошёл, а работа не сделана — «просрочено». */
export function withComputedStatus(item: Homework): Homework {
  if (item.status === 'done') return item
  if (item.due_date && item.due_date < todayIso()) return { ...item, status: 'overdue' }
  return item
}

export async function listHomeworkDetailed(): Promise<HomeworkWithChecklist[]> {
  const rows = await many<HomeworkWithChecklist>(
    TABLE,
    adminClient().from(TABLE).select('*, homework_checklist(*)').order('due_date'),
  )
  return rows.map(r => ({ ...withComputedStatus(r), homework_checklist: r.homework_checklist ?? [] }))
}

export async function setHomeworkStatus(id: string, status: HomeworkStatus): Promise<Homework> {
  return one<Homework>(TABLE, adminClient().from(TABLE).update({ status }).eq('id', id).select().single())
}

// --- чеклист ----------------------------------------------------------------

export const listChecklist = (homeworkId: string): Promise<HomeworkChecklistItem[]> =>
  many<HomeworkChecklistItem>('homework_checklist', adminClient().from('homework_checklist').select('*').eq('homework_id', homeworkId).order('sort_order'))

export const addChecklistItem = (homeworkId: string, title: string): Promise<HomeworkChecklistItem> =>
  one<HomeworkChecklistItem>('homework_checklist', adminClient().from('homework_checklist').insert({ homework_id: homeworkId, title }).select().single())

export const updateChecklistItem = (id: string, patch: Partial<HomeworkChecklistItem>): Promise<HomeworkChecklistItem> =>
  one<HomeworkChecklistItem>('homework_checklist', adminClient().from('homework_checklist').update(patch).eq('id', id).select().single())

export const removeChecklistItem = (id: string): Promise<void> =>
  nothing('homework_checklist', adminClient().from('homework_checklist').delete().eq('id', id))

export const replaceChecklist = (homeworkId: string, items: { title: string; done?: boolean }[]): Promise<void> =>
  replaceChildren('homework_checklist', 'homework_id', homeworkId, items.map(i => ({ title: i.title, done: i.done ?? false })))

/** Фильтры для страницы ДЗ. */
export type HomeworkFilter = 'all' | 'today' | 'week' | 'overdue' | 'done'

export function filterHomework(rows: HomeworkWithChecklist[], filter: HomeworkFilter): HomeworkWithChecklist[] {
  const today = todayIso()
  const weekEnd = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)
  switch (filter) {
    case 'today': return rows.filter(r => r.due_date === today)
    case 'week': return rows.filter(r => r.due_date && r.due_date >= today && r.due_date <= weekEnd)
    case 'overdue': return rows.filter(r => r.status === 'overdue')
    case 'done': return rows.filter(r => r.status === 'done')
    default: return rows
  }
}
