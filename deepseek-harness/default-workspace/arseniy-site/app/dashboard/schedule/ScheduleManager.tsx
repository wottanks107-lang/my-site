'use client'
import { useActionState, useEffect, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Pencil, Plus } from 'lucide-react'
import { deleteEventAction, saveEventAction, toggleEventStatusAction } from '@/lib/actions/schedule'
import { IDLE } from '@/lib/actions/types'
import ActionForm from '@/components/dashboard/ActionForm'
import ConfirmDelete from '@/components/dashboard/ConfirmDelete'
import Modal from '@/components/dashboard/Modal'
import { useToast } from '@/components/dashboard/Toast'
import { SelectField, TextAreaField, TextField } from '@/components/dashboard/Fields'
import {
  DAY_NAMES, REPEAT_LABEL, addDays, dateInputValue, eventTimeLabel, eventsOn, formatDayFull,
  formatWeekRange, isoWeekday, parseIsoDate, startOfWeek, timeLabel, toIsoDate, weekGrid, weekdayOptions,
} from '@/lib/schedule-utils'
import type { RepeatKind, ScheduleEvent } from '@/lib/types'

const COLORS = [
  { value: '#E5202E', label: 'Красный' },
  { value: '#3B82F6', label: 'Синий' },
  { value: '#22C55E', label: 'Зелёный' },
  { value: '#F59E0B', label: 'Янтарный' },
  { value: '#A855F7', label: 'Фиолетовый' },
  { value: '#9AA0A6', label: 'Серый' },
]

const REMINDERS = [
  { value: '', label: 'Без напоминания' },
  { value: '5', label: 'За 5 минут' },
  { value: '15', label: 'За 15 минут' },
  { value: '30', label: 'За 30 минут' },
  { value: '60', label: 'За час' },
]

const CATEGORIES = ['Учёба', 'Спорт', 'Развитие', 'Работа', 'Личное']

const REPEAT_OPTIONS = (Object.keys(REPEAT_LABEL) as RepeatKind[])
  .map(value => ({ value, label: REPEAT_LABEL[value] }))

type Preset = { date?: string; weekday?: number } | null

function EventChip({ event, onEdit }: { event: ScheduleEvent; onEdit: (event: ScheduleEvent) => void }) {
  return (
    <button
      type="button"
      className={'event-chip' + (event.status === 'done' ? ' done' : '')}
      style={{ borderLeftColor: event.color ?? 'var(--red)' }}
      onClick={() => onEdit(event)}
      title={`${eventTimeLabel(event)} ${event.title}`}
    >
      <span className="t">{eventTimeLabel(event)}</span>
      {event.title}
    </button>
  )
}

function EventForm({ event, preset, onClose }: { event: ScheduleEvent | null; preset: Preset; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(saveEventAction, IDLE)
  const toast = useToast()
  const [repeat, setRepeat] = useState<RepeatKind>(event?.repeat ?? 'none')

  const today = new Date()

  useEffect(() => {
    if (state.ok) {
      toast(event ? 'Событие обновлено' : 'Событие добавлено')
      onClose()
    } else if (state.error) {
      toast(state.error, 'error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const defaultDate = dateInputValue(preset?.date ?? event?.event_date, today)
  const defaultWeekday = String(preset?.weekday ?? event?.day_of_week ?? isoWeekday(today))

  return (
    <Modal open title={event ? 'Изменить событие' : 'Новое событие'} onClose={onClose}>
      <form action={formAction} className="form-grid">
        <input type="hidden" name="id" value={event?.id ?? ''} />

        <TextField name="title" label="Название" defaultValue={event?.title} required placeholder="Python" />

        <div className="form-cols">
          <label className="field">
            <span>Повтор</span>
            <select name="repeat" value={repeat} onChange={event => setRepeat(event.target.value as RepeatKind)}>
              {REPEAT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          {repeat === 'none' ? (
            <TextField name="event_date" label="Дата" type="date" defaultValue={defaultDate} required />
          ) : (
            <SelectField name="day_of_week" label="День недели" defaultValue={defaultWeekday} options={weekdayOptions} />
          )}
        </div>

        <div className="form-cols">
          <TextField name="start_time" label="Начало" type="time" defaultValue={event ? timeLabel(event.start_time) : '09:00'} required />
          <TextField name="end_time" label="Окончание" type="time" defaultValue={event?.end_time ? timeLabel(event.end_time) : ''} />
        </div>

        {repeat !== 'none' && (
          <TextField
            name="repeat_until"
            label="Повторять до"
            type="date"
            defaultValue={event?.repeat_until ?? ''}
            hint="Оставь пустым, чтобы повторялось всегда"
          />
        )}

        <div className="form-cols">
          <label className="field">
            <span>Категория</span>
            <input name="category" list="event-categories" defaultValue={event?.category ?? ''} placeholder="Учёба" />
            <datalist id="event-categories">
              {CATEGORIES.map(category => <option key={category} value={category} />)}
            </datalist>
          </label>
          <SelectField
            name="reminder_minutes"
            label="Напоминание"
            defaultValue={event?.reminder_minutes != null ? String(event.reminder_minutes) : ''}
            options={REMINDERS}
            hint="Хранится в базе; показывается в карточке события"
          />
        </div>

        <div className="form-cols">
          <TextField name="location" label="Место" defaultValue={event?.location} placeholder="Школа, зал, дома" />
          <TextField name="url" label="Ссылка" defaultValue={event?.url} placeholder="https://…" />
        </div>

        <div className="field">
          <span>Цвет</span>
          <div className="color-row">
            {COLORS.map(color => (
              <label key={color.value} className="color-dot" style={{ background: color.value }} title={color.label}>
                <input
                  type="radio"
                  name="color"
                  value={color.value}
                  defaultChecked={(event?.color ?? COLORS[0].value) === color.value}
                />
                <span className="sr-only">{color.label}</span>
              </label>
            ))}
          </div>
        </div>

        <TextAreaField name="description" label="Описание" rows={3} defaultValue={event?.description} />

        <div className="modal-foot">
          <button type="button" className="btn ghost sm" onClick={onClose}>Отмена</button>
          <button className="btn fill sm" disabled={pending}>{pending ? 'Сохраняю…' : 'Сохранить'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function ScheduleManager({ events, error }: { events: ScheduleEvent[]; error: string | null }) {
  const [view, setView] = useState<'day' | 'week' | 'list'>('week')
  const [anchor, setAnchor] = useState(() => new Date())
  const [editing, setEditing] = useState<ScheduleEvent | null>(null)
  const [creating, setCreating] = useState<Preset>(null)
  const [isCreating, setIsCreating] = useState(false)

  const todayIso = toIsoDate(new Date())
  const monday = startOfWeek(anchor)
  const week = weekGrid(events, monday)
  const dayEvents = eventsOn(events, anchor)
  const weekCount = week.reduce((sum, day) => sum + day.events.length, 0)
  const recurring = events.filter(event => event.repeat !== 'none').length

  const openCreate = (preset: Preset) => {
    setCreating(preset)
    setIsCreating(true)
  }

  const shift = (direction: number) => {
    setAnchor(current => addDays(current, view === 'week' ? direction * 7 : direction))
  }

  return (
    <>
      <div className="dash-grid" style={{ marginBottom: 24 }}>
        {[
          ['Событий на неделе', weekCount],
          ['Сегодня', eventsOn(events, new Date()).length],
          ['Повторяющихся', recurring],
          ['Всего', events.length],
        ].map(([label, value]) => (
          <div key={String(label)} className="panel">
            <span className="muted" style={{ fontSize: 13 }}>{label}</span>
            <span className="kpi" style={{ marginTop: 8 }}>{value}</span>
          </div>
        ))}
      </div>

      <div className="dash-top" style={{ marginBottom: 18 }}>
        <div>
          <div className="view-tabs">
            {([['day', 'День'], ['week', 'Неделя'], ['list', 'Список']] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={'btn sm' + (view === key ? ' on' : ' ghost')}
                onClick={() => setView(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="lead" style={{ margin: '14px 0 0', fontSize: 15 }}>
            {view === 'week' ? formatWeekRange(monday) : formatDayFull(anchor)}
          </p>
        </div>

        <div className="row-actions">
          <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Назад">
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button type="button" className="btn ghost sm" onClick={() => setAnchor(new Date())}>Сегодня</button>
          <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Вперёд">
            <ChevronRight size={16} aria-hidden />
          </button>
          <button type="button" className="btn fill sm" onClick={() => openCreate({ date: toIsoDate(anchor) })}>
            <Plus size={15} aria-hidden /> Событие
          </button>
        </div>
      </div>

      {view === 'week' && (
        <div className="week">
          {week.map(day => (
            <div key={day.iso} className={'week-col' + (day.iso === todayIso ? ' today' : '')}>
              <div className="week-head">
                <span>{day.short} <b>{day.date.getDate()}</b></span>
                <button
                  type="button"
                  className="x"
                  onClick={() => openCreate({ date: day.iso })}
                  aria-label={`Добавить событие на ${day.iso}`}
                >+</button>
              </div>
              {day.events.map(event => (
                <EventChip key={`${event.id}-${day.iso}`} event={event} onEdit={setEditing} />
              ))}
              {day.events.length === 0 && <span className="week-empty">—</span>}
            </div>
          ))}
        </div>
      )}

      {view === 'day' && (
        <div>
          {dayEvents.length === 0 && !error && (
            <p className="empty">На этот день ничего не запланировано.</p>
          )}
          {dayEvents.map(event => (
            <div key={event.id} className={'day-item' + (event.status === 'done' ? ' done' : '')}>
              <span className="day-time">{eventTimeLabel(event)}</span>
              <span style={{ flex: 1 }}>
                <b style={{ fontWeight: 600, color: 'var(--tx)' }}>{event.title}</b>
                {event.location && <span className="muted"> · {event.location}</span>}
                {event.category && <span className="badge gray" style={{ marginLeft: 10 }}>{event.category}</span>}
                {event.repeat !== 'none' && (
                  <span className="muted" style={{ fontSize: 12.5, display: 'block' }}>
                    {REPEAT_LABEL[event.repeat]}
                    {event.day_of_week ? ` · ${DAY_NAMES[event.day_of_week - 1]}` : ''}
                  </span>
                )}
              </span>
              <div className="row-actions">
                <ActionForm action={toggleEventStatusAction}>
                  <input type="hidden" name="id" value={event.id} />
                  <input type="hidden" name="status" value={event.status} />
                  <button className="icon-btn" title={event.status === 'done' ? 'Вернуть в план' : 'Отметить выполненным'}>
                    <Check size={15} aria-hidden />
                  </button>
                </ActionForm>
                <button type="button" className="icon-btn" onClick={() => setEditing(event)} aria-label="Изменить">
                  <Pencil size={15} aria-hidden />
                </button>
                <ConfirmDelete id={event.id} action={deleteEventAction} title="Удалить событие?" description={event.title} />
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'list' && (
        <div className="list">
          {events.length === 0 && !error && <p className="empty">Событий пока нет. Добавь первое — например, «Python» по вторникам в 16:00.</p>}
          {events.map(event => (
            <article key={event.id} className="panel">
              <div className="panel-top">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="badge gray">{REPEAT_LABEL[event.repeat]}</span>
                  {event.repeat !== 'none' && event.day_of_week && (
                    <span className="muted" style={{ fontSize: 12.5 }}>{DAY_NAMES[event.day_of_week - 1]}</span>
                  )}
                  {event.repeat === 'none' && event.event_date && (
                    <span className="muted" style={{ fontSize: 12.5 }}>{formatDayFull(parseIsoDate(event.event_date))}</span>
                  )}
                  {event.category && <span className="muted" style={{ fontSize: 12.5 }}>{event.category}</span>}
                </div>
                <div className="row-actions">
                  <button type="button" className="icon-btn" onClick={() => setEditing(event)} aria-label="Изменить">
                    <Pencil size={15} aria-hidden />
                  </button>
                  <ConfirmDelete id={event.id} action={deleteEventAction} title="Удалить событие?" description={event.title} />
                </div>
              </div>
              <h3 style={{ fontSize: 17 }}>
                <span style={{ color: event.color ?? 'var(--red)' }}>●</span> {eventTimeLabel(event)} · {event.title}
              </h3>
              {event.description && <p style={{ marginTop: 8, marginBottom: 0 }}>{event.description}</p>}
            </article>
          ))}
        </div>
      )}

      {isCreating && <EventForm event={null} preset={creating} onClose={() => setIsCreating(false)} />}
      {editing && <EventForm event={editing} preset={null} onClose={() => setEditing(null)} />}
    </>
  )
}
