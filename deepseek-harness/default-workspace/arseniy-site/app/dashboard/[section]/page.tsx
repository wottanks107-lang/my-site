import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock } from 'lucide-react'

// Временная страница для разделов, которые ещё не реализованы.
// Как только у раздела появляется свой page.tsx, он перекрывает этот маршрут.

const SECTIONS: Record<string, { title: string; about: string }> = {
  schedule: { title: 'Расписание', about: 'Недельная сетка, разовые и повторяющиеся события, перенос мышью.' },
  homework: { title: 'Домашние задания', about: 'Предмет, дедлайн, приоритет, статус, чеклист и фильтры.' },
  notes: { title: 'Заметки', about: 'Markdown-редактор, категории, теги, закрепление и поиск.' },
  projects: { title: 'Проекты', about: 'Задачи, changelog, скриншоты, ссылки на GitHub и демо.' },
  goals: { title: 'Цели', about: 'Прогресс, дедлайн, метрика «от → до» и подзадачи с чекбоксами.' },
  workouts: { title: 'Тренировки', about: 'Упражнения, подходы, повторения, вес и статистика по неделям.' },
  books: { title: 'Книги', about: 'Полка, прогресс чтения, рейтинг и даты начала и завершения.' },
  profile: { title: 'Профиль', about: 'Имя, возраст, город, направления, фото и текст кнопок.' },
  settings: { title: 'Настройки', about: 'Заголовок сайта, описание, OG-картинка и акцентный цвет.' },
}

type Props = { params: Promise<{ section: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params
  return { title: SECTIONS[section]?.title ?? 'Раздел', robots: { index: false, follow: false } }
}

export default async function SectionPlaceholder({ params }: Props) {
  const { section } = await params
  const meta = SECTIONS[section]
  if (!meta) notFound()

  return (
    <>
      <div className="dash-top">
        <div>
          <div className="eyebrow">Раздел</div>
          <h1 className="dash-title">{meta.title}</h1>
        </div>
        <Link href="/dashboard" className="btn ghost sm"><ArrowLeft size={14} aria-hidden /> Обзор</Link>
      </div>

      <div className="panel" style={{ maxWidth: 620 }}>
        <div className="panel-top">
          <span className="badge"><Clock size={12} aria-hidden /> в разработке</span>
        </div>
        <h3 style={{ marginBottom: 12 }}>Раздел ещё не готов</h3>
        <p style={{ marginBottom: 0 }}>{meta.about}</p>
      </div>
    </>
  )
}
