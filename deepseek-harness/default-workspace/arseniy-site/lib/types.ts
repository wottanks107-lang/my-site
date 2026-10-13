// Типы домена Personal OS. Отражают структуру таблиц из supabase/migrations.

export type ProjectStatus = 'idea' | 'experiment' | 'building' | 'in_progress' | 'paused' | 'done'
export type GoalStatus = 'not_started' | 'in_progress' | 'done' | 'paused'
export type HomeworkStatus = 'new' | 'in_progress' | 'done' | 'overdue'
export type PriorityLevel = 'low' | 'normal' | 'high'
export type RepeatKind = 'none' | 'daily' | 'weekdays' | 'weekly'
export type WorkoutKind = 'gym' | 'swim' | 'run' | 'home' | 'other'
export type BookStatus = 'want' | 'reading' | 'done' | 'dropped'
export type MediaKind = 'image' | 'file'

/** Общие служебные поля строк таблицы. */
export type Base = { id: string; created_at?: string; updated_at?: string }

export type Profile = {
  id: number
  name: string
  age: number | null
  city: string | null
  tagline: string | null
  short_bio: string | null
  bio_paragraphs: string[]
  status: string | null
  directions: string[]
  email: string | null
  photo_url: string | null
  photo_position: string
  hero_bg_url: string | null
  primary_button_label: string
  secondary_button_label: string
}

export type SiteSettings = {
  id: number
  site_title: string
  site_description: string
  og_image_url: string | null
  accent_color: string
}

export type SocialLink = Base & {
  label: string
  url: string
  icon: string | null
  username: string | null
  sort_order: number
  is_public: boolean
}

export type TimelineEvent = Base & {
  period: string
  title: string
  body: string | null
  sort_order: number
  is_public: boolean
}

export type Skill = Base & {
  name: string
  level: string | null
  value: number
  sort_order: number
  is_public: boolean
}

export type Project = Base & {
  slug: string
  title: string
  summary: string | null
  description: string | null
  status: ProjectStatus
  progress: number
  tech: string[]
  github_url: string | null
  demo_url: string | null
  cover_url: string | null
  started_on: string | null
  period_label: string | null
  is_public: boolean
  sort_order: number
}

export type ProjectTask = { id: string; project_id: string; title: string; done: boolean; sort_order: number }
export type ProjectMedia = { id: string; project_id: string; url: string; caption: string | null; sort_order: number }
export type ProjectChangelog = { id: string; project_id: string; happened_on: string; body: string }

export type Book = Base & {
  title: string
  author: string | null
  status: BookStatus
  percent: number
  rating: number | null
  note: string | null
  cover_url: string | null
  started_on: string | null
  finished_on: string | null
  is_public: boolean
  sort_order: number
}

export type ScheduleEvent = Base & {
  title: string
  description: string | null
  category: string | null
  color: string | null
  day_of_week: number | null
  event_date: string | null
  start_time: string
  end_time: string | null
  repeat: RepeatKind
  repeat_until: string | null
  reminder_minutes: number | null
  status: string
  location: string | null
  url: string | null
}

export type Homework = Base & {
  subject: string
  subject_color: string | null
  topic: string | null
  description: string | null
  assigned_on: string | null
  due_date: string | null
  due_time: string | null
  priority: PriorityLevel
  status: HomeworkStatus
  url: string | null
  attachment_url: string | null
  note: string | null
}

export type HomeworkChecklistItem = { id: string; homework_id: string; title: string; done: boolean; sort_order: number }

export type Note = Base & {
  title: string
  body: string | null
  category: string | null
  note_date: string
  pinned: boolean
  image_url: string | null
  links: string[]
  is_public: boolean
}

export type NoteTag = { id: string; note_id: string; tag: string }

export type Goal = Base & {
  title: string
  category: string | null
  description: string | null
  deadline: string | null
  progress: number
  status: GoalStatus
  priority: PriorityLevel
  metric_from: string | null
  metric_to: string | null
  is_public: boolean
  sort_order: number
}

export type GoalTask = { id: string; goal_id: string; title: string; done: boolean; sort_order: number }

export type Workout = Base & {
  workout_date: string
  workout_time: string | null
  kind: WorkoutKind
  duration_min: number | null
  comment: string | null
}

export type WorkoutExercise = {
  id: string
  workout_id: string
  name: string
  sets: number | null
  reps: number | null
  weight_kg: number | null
  sort_order: number
}

export type FinanceMonth = Base & {
  month: string
  income: number
  expense: number
  sales: number
}

export type MediaItem = {
  id: string
  bucket: string
  path: string
  url: string
  kind: MediaKind
  mime: string | null
  size_bytes: number | null
  folder: string | null
  created_at: string
}

/** Человеческие подписи для интерфейса. */
export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  idea: 'Идея', experiment: 'Эксперимент', building: 'Собираю',
  in_progress: 'В работе', paused: 'Пауза', done: 'Готово',
}
export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  not_started: 'Не начата', in_progress: 'В работе', done: 'Достигнута', paused: 'Отложена',
}
export const HOMEWORK_STATUS_LABEL: Record<HomeworkStatus, string> = {
  new: 'Новое', in_progress: 'В работе', done: 'Готово', overdue: 'Просрочено',
}
export const PRIORITY_LABEL: Record<PriorityLevel, string> = {
  low: 'Низкий', normal: 'Обычный', high: 'Высокий',
}
export const BOOK_STATUS_LABEL: Record<BookStatus, string> = {
  want: 'Хочу прочитать', reading: 'Читаю', done: 'Прочитано', dropped: 'Отложена',
}
export const WORKOUT_KIND_LABEL: Record<WorkoutKind, string> = {
  gym: 'Зал', swim: 'Плавание', run: 'Бег', home: 'Дома', other: 'Другое',
}
export const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'] as const
export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const
