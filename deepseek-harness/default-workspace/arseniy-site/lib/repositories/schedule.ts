// Расписание: разовые события и повторяющиеся (ежедневно, по будням, еженедельно).
import { adminClient } from '../supabase/client'
import { createRepo } from './crud'
import { many } from './errors'
import {
  addDays, eventsOn, startOfWeek, toIsoDate, upcoming, weekGrid,
} from '../schedule-utils'
import type { ScheduleEvent } from '../types'

const TABLE = 'schedule_events'
const repo = createRepo<ScheduleEvent>(TABLE, {
  order: [{ column: 'start_time' }],
  publicColumn: null, // расписание приватно
})

export const listEvents = repo.list
export const getEvent = repo.get
export const createEvent = repo.create
export const updateEvent = repo.update
export const removeEvent = repo.remove

// Чистые помощники живут в lib/schedule-utils.ts; здесь они переэкспортированы,
// чтобы страницы могли брать всё из одного места.
export { eventsOn, isoWeekday, parseIsoDate, startOfWeek, toIsoDate, weekGrid } from '../schedule-utils'

/** События на конкретный день. Запрос к базе один. */
export async function listEventsForDate(date: Date): Promise<ScheduleEvent[]> {
  return eventsOn(await repo.list(), date)
}

/** Раскладка на неделю, начиная с понедельника. */
export async function listWeek(weekStart: Date) {
  const monday = startOfWeek(weekStart)
  return weekGrid(await repo.list(), monday)
}

/** Ближайшие события сегодня и завтра — для карточки на dashboard. */
export async function listUpcoming(limit = 5): Promise<ScheduleEvent[]> {
  return upcoming(await repo.list(), limit)
}

export const listAllEventRows = (): Promise<ScheduleEvent[]> =>
  many<ScheduleEvent>(TABLE, adminClient().from(TABLE).select('*').order('start_time'))

/** События за произвольный диапазон — пригодится для списков и статистики. */
export async function listEventsBetween(from: Date, days: number): Promise<{ iso: string; events: ScheduleEvent[] }[]> {
  const all = await repo.list()
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(from, index)
    return { iso: toIsoDate(date), events: eventsOn(all, date) }
  })
}
