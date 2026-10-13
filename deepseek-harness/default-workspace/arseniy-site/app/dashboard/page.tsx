import Link from 'next/link'
import { ArrowUpRight, CalendarDays, Flame, NotebookPen, Target, TrendingUp } from 'lucide-react'
import { firstError, safe } from '@/lib/safe'
import {
  getProfile, getWorkoutStats, listEventsForDate, listGoalsDetailed,
  listHomeworkDetailed, listProjects, toIsoDate, type WorkoutStats,
} from '@/lib/repositories'
import { GOAL_STATUS_LABEL, HOMEWORK_STATUS_LABEL, PROJECT_STATUS_LABEL } from '@/lib/types'

export const dynamic = 'force-dynamic'

const EMPTY_STATS: WorkoutStats = { week: 0, month: 0, total: 0, streak: 0, byKind: { gym: 0, swim: 0, other: 0 } }

function greeting() {
  const hour = new Date().getHours()
  if (hour < 5) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export default async function DashboardOverview() {
  const [profile, goals, projects, homework, stats, events] = await Promise.all([
    safe(() => getProfile(), null),
    safe(() => listGoalsDetailed(), []),
    safe(() => listProjects(), []),
    safe(() => listHomeworkDetailed(), []),
    safe(() => getWorkoutStats(), EMPTY_STATS),
    safe(() => listEventsForDate(new Date()), []),
  ])

  const error = firstError(profile, goals, projects, homework, stats, events)
  const name = profile.data?.name ?? 'Арсений'
  const today = toIsoDate(new Date())

  const activeGoals = goals.data.filter(goal => goal.status !== 'done')
  const averageProgress = goals.data.length
    ? Math.round(goals.data.reduce((sum, goal) => sum + goal.progress, 0) / goals.data.length)
    : 0
  const activeProjects = projects.data.filter(project => project.status !== 'done')
  const openHomework = homework.data.filter(item => item.status !== 'done')

  const dateLabel = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  const cards = [
    { label: 'Целей в работе', value: activeGoals.length, hint: `всего ${goals.data.length}`, icon: Target },
    { label: 'Средний прогресс', value: `${averageProgress}%`, hint: 'по всем целям', icon: TrendingUp },
    { label: 'Проектов в работе', value: activeProjects.length, hint: `всего ${projects.data.length}`, icon: ArrowUpRight },
    { label: 'Тренировок за неделю', value: stats.data.week, hint: `серия ${stats.data.streak} дн.`, icon: Flame },
  ]

  return (
    <>
      <div className="dash-top">
        <div>
          <div className="eyebrow">{dateLabel}</div>
          <h1 className="dash-title">{greeting()}, {name}.</h1>
        </div>
        <Link href="/" className="btn ghost sm">На сайт <ArrowUpRight size={14} aria-hidden /></Link>
      </div>

      {error && (
        <div className="dash-error">
          Часть данных не загрузилась: <code>{error}</code>
        </div>
      )}

      <div className="dash-grid" style={{ marginBottom: 30 }}>
        {cards.map(({ label, value, hint, icon: Icon }) => (
          <div key={label} className="panel">
            <div className="panel-top" style={{ marginBottom: 10 }}>
              <span className="muted" style={{ fontSize: 13 }}>{label}</span>
              <Icon size={16} aria-hidden style={{ color: 'var(--red)' }} />
            </div>
            <span className="kpi">{value}</span>
            <span className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>{hint}</span>
          </div>
        ))}
      </div>

      <div className="grid two">
        <section className="panel">
          <div className="panel-top">
            <h3 style={{ margin: 0 }}>Сегодня</h3>
            <Link href="/dashboard/schedule" className="x"><CalendarDays size={15} aria-hidden /> расписание</Link>
          </div>
          {events.data.length === 0 ? (
            <p style={{ marginBottom: 0, color: 'var(--mu-2)' }}>
              Событий на {today} нет. Добавь их в разделе «Расписание».
            </p>
          ) : (
            <div className="day-list">
              {[...events.data]
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map(event => (
                  <div key={event.id} className="day-item">
                    <span className="day-time">{event.start_time.slice(0, 5)}</span>
                    <span style={{ flex: 1 }}>
                      {event.title}
                      {event.location && <span className="muted"> · {event.location}</span>}
                    </span>
                    {event.category && <span className="badge gray">{event.category}</span>}
                  </div>
                ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-top">
            <h3 style={{ margin: 0 }}>Домашние задания</h3>
            <Link href="/dashboard/homework" className="x"><NotebookPen size={15} aria-hidden /> все</Link>
          </div>
          {openHomework.length === 0 ? (
            <p style={{ marginBottom: 0, color: 'var(--mu-2)' }}>Открытых заданий нет.</p>
          ) : (
            <div className="day-list">
              {openHomework.slice(0, 4).map(item => (
                <div key={item.id} className="day-item">
                  <span className="day-time" style={{ minWidth: 74 }}>{item.due_date ?? '—'}</span>
                  <span style={{ flex: 1 }}>{item.subject}{item.topic ? ` · ${item.topic}` : ''}</span>
                  <span className="badge gray">{HOMEWORK_STATUS_LABEL[item.status]}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-top">
            <h3 style={{ margin: 0 }}>Цели</h3>
            <Link href="/dashboard/goals" className="x"><Target size={15} aria-hidden /> все</Link>
          </div>
          {activeGoals.length === 0 ? (
            <p style={{ marginBottom: 0, color: 'var(--mu-2)' }}>Активных целей нет.</p>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {activeGoals.slice(0, 4).map(goal => (
                <div key={goal.id}>
                  <div className="progress-row">
                    <span style={{ color: 'var(--tx)' }}>{goal.title}</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="progress" style={{ margin: '8px 0 0' }}><i style={{ width: `${goal.progress}%` }} /></div>
                  <span className="muted" style={{ fontSize: 12.5 }}>
                    {GOAL_STATUS_LABEL[goal.status]}
                    {goal.deadline ? ` · до ${goal.deadline}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-top">
            <h3 style={{ margin: 0 }}>Проекты</h3>
            <Link href="/dashboard/projects" className="x"><ArrowUpRight size={15} aria-hidden /> все</Link>
          </div>
          {projects.data.length === 0 ? (
            <p style={{ marginBottom: 0, color: 'var(--mu-2)' }}>Проектов пока нет.</p>
          ) : (
            <div style={{ display: 'grid', gap: 18 }}>
              {projects.data.slice(0, 4).map(project => (
                <div key={project.id}>
                  <div className="progress-row">
                    <span style={{ color: 'var(--tx)' }}>{project.title}</span>
                    <span className="badge gray">{PROJECT_STATUS_LABEL[project.status]}</span>
                  </div>
                  <div className="progress" style={{ margin: '8px 0 0' }}><i style={{ width: `${project.progress}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
