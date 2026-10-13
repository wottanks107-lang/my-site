// Чистые функции расписания: раскладка повторяющихся событий по дням.
// Используются и на сервере, и в браузере, поэтому здесь нет ни базы, ни React.
import type { RepeatKind, ScheduleEvent } from './types'

export const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'] as const
export const DAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const

export const REPEAT_LABEL: Record<RepeatKind, string> = {
  none: 'Не повторяется',
  daily: 'Каждый день',
  weekdays: 'По будням',
  weekly: 'Каждую неделю',
}

/** 1 = понедельник … 7 = воскресенье, как в базе. */
export const isoWeekday = (date: Date): number => ((date.getDay() + 6) % 7) + 1

/** Локальная дата → «2026-10-06» (без сдвига по часовому поясу). */
export const toIsoDate = (date: Date): string => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

/** «2026-10-06» → локальная дата. */
export const parseIsoDate = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Понедельник недели, в которую попадает дата. */
export const startOfWeek = (date: Date): Date => addDays(date, -(isoWeekday(date) - 1))

/** «08:30:00» → «08:30» */
export const timeLabel = (time: string): string => time.slice(0, 5)

export const eventTimeLabel = (event: ScheduleEvent): string =>
  event.end_time ? `${timeLabel(event.start_time)}–${timeLabel(event.end_time)}` : timeLabel(event.start_time)

/** Попадает ли событие на этот день. */
export function occursOn(event: ScheduleEvent, date: Date): boolean {
  const iso = toIsoDate(date)
  const weekday = isoWeekday(date)

  if (event.repeat === 'none') return event.event_date === iso
  if (event.repeat_until && event.repeat_until < iso) return false
  if (event.event_date && event.event_date > iso) return false // ещё не началось

  switch (event.repeat) {
    case 'daily': return true
    case 'weekdays': return weekday <= 5
    case 'weekly': return event.day_of_week === weekday
    default: return false
  }
}

const byStartTime = (a: ScheduleEvent, b: ScheduleEvent) =>
  a.start_time.localeCompare(b.start_time) || a.title.localeCompare(b.title)

/** События одного дня, отсортированные по времени. */
export const eventsOn = (events: ScheduleEvent[], date: Date): ScheduleEvent[] =>
  events.filter(event => occursOn(event, date)).sort(byStartTime)

/** Семь дней недели с событиями — начиная с понедельника. */
export function weekGrid(events: ScheduleEvent[], monday: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday, index)
    return {
      date,
      iso: toIsoDate(date),
      weekday: index + 1,
      name: DAY_NAMES[index],
      short: DAY_SHORT[index],
      events: eventsOn(events, date),
    }
  })
}

/** Ближайшие события от текущего момента в пределах нескольких дней. */
export function upcoming(events: ScheduleEvent[], limit = 5, from = new Date()): ScheduleEvent[] {
  const nowTime = `${String(from.getHours()).padStart(2, '0')}:${String(from.getMinutes()).padStart(2, '0')}`
  const today = eventsOn(events, from).filter(event => event.start_time >= nowTime)
  const tomorrow = eventsOn(events, addDays(from, 1))
  return [...today, ...tomorrow].slice(0, limit)
}

/** Дни недели по порядку — для выпадающего списка «день недели». */
export const weekdayOptions = DAY_NAMES.map((label, index) => ({ value: String(index + 1), label }))

// Названия месяцев в родительном падеже. Форматируем даты вручную, а не через
// toLocaleDateString: так сервер и браузер дают одинаковый текст и нет
// расхождения при гидратации.
export const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
] as const

export const formatDay = (date: Date): string => `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`

export const formatDayFull = (date: Date): string =>
  `${DAY_NAMES[isoWeekday(date) - 1].toLowerCase()}, ${formatDay(date)}`

/** «6 – 12 октября» */
export const formatWeekRange = (monday: Date): string => {
  const sunday = addDays(monday, 6)
  const sameMonth = monday.getMonth() === sunday.getMonth()
  const left = sameMonth ? String(monday.getDate()) : formatDay(monday)
  return `${left} – ${formatDay(sunday)}`
}

/** Дата для поля ввода: «2026-10-06». */
export const dateInputValue = (value: string | null | undefined, fallback: Date): string =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : toIsoDate(fallback)
