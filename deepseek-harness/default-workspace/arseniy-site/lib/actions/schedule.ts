'use server'
// Серверные экшены расписания.
import { revalidatePath } from 'next/cache'
import { isAuthed } from '../auth'
import { createEvent, removeEvent, updateEvent } from '../repositories/schedule'
import type { RepeatKind } from '../types'
import { ActionState, DENIED, boundedInt, message, nullable, str } from './types'

const REPEATS: RepeatKind[] = ['none', 'daily', 'weekdays', 'weekly']

const refresh = () => {
  revalidatePath('/dashboard/schedule')
  revalidatePath('/dashboard')
}

export async function saveEventAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isAuthed())) return DENIED

  const title = str(formData, 'title')
  if (!title) return { ok: false, error: 'Название события обязательно' }

  const startTime = str(formData, 'start_time')
  if (!startTime) return { ok: false, error: 'Укажи время начала' }

  const rawRepeat = str(formData, 'repeat') as RepeatKind
  const repeat: RepeatKind = REPEATS.includes(rawRepeat) ? rawRepeat : 'none'

  const eventDate = nullable(formData, 'event_date')
  if (repeat === 'none' && !eventDate) {
    return { ok: false, error: 'Для разового события нужна дата' }
  }

  const endTime = nullable(formData, 'end_time')
  if (endTime && endTime <= startTime) {
    return { ok: false, error: 'Время окончания должно быть позже начала' }
  }

  const reminder = str(formData, 'reminder_minutes')

  const payload = {
    title,
    description: nullable(formData, 'description'),
    category: nullable(formData, 'category'),
    color: nullable(formData, 'color'),
    repeat,
    // Разовое событие хранит дату, повторяющееся — день недели.
    event_date: repeat === 'none' ? eventDate : null,
    day_of_week: repeat === 'none' ? null : boundedInt(formData, 'day_of_week', 1, 7, 1),
    repeat_until: repeat === 'none' ? null : nullable(formData, 'repeat_until'),
    start_time: startTime,
    end_time: endTime,
    reminder_minutes: reminder === '' ? null : boundedInt(formData, 'reminder_minutes', 0, 1440, 30),
    status: str(formData, 'status') || 'planned',
    location: nullable(formData, 'location'),
    url: nullable(formData, 'url'),
  }

  try {
    const id = str(formData, 'id')
    if (id) await updateEvent(id, payload)
    else await createEvent(payload)
    refresh()
    return { ok: true, error: null }
  } catch (error) {
    return { ok: false, error: message(error, 'Не удалось сохранить событие') }
  }
}

export async function deleteEventAction(formData: FormData): Promise<ActionState> {
  if (!(await isAuthed())) return DENIED
  try {
    await removeEvent(str(formData, 'id'))
    refresh()
    return { ok: true, error: null }
  } catch (error) {
    return { ok: false, error: message(error, 'Не удалось удалить событие') }
  }
}

/** Отметить событие выполненным или вернуть в план. */
export async function toggleEventStatusAction(formData: FormData): Promise<ActionState> {
  if (!(await isAuthed())) return DENIED
  const id = str(formData, 'id')
  const done = str(formData, 'status') === 'done'

  try {
    await updateEvent(id, { status: done ? 'planned' : 'done' })
    refresh()
    return { ok: true, error: null }
  } catch (error) {
    return { ok: false, error: message(error, 'Не удалось изменить статус') }
  }
}
