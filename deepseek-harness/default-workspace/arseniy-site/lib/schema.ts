// Схема контента сайта. Этот файл используется и на сервере, и в браузере,
// поэтому здесь нет ни 'use client', ни импортов React.

export type Id = { id: string }
export type About = Id & { text: string }
export type Timeline = Id & { period: string; title: string; text: string }
export type Goal = Id & { area: string; text: string }
export type Skill = Id & { name: string; level: string; value: number }
export type Project = Id & { name: string; status: string; date: string; text: string; tech: string; progress: number }
export type Book = Id & { title: string; author: string; status: 'want' | 'reading' | 'done'; percent: number; note: string }
export type Note = Id & { date: string; category: string; title: string; text: string }
export type Finance = Id & { month: string; income: number; expense: number; sales: number }
export type Workout = Id & { date: string; kind: 'gym' | 'swim' }
export type Social = Id & { label: string; url: string }

export const uid = () => Math.random().toString(36).slice(2, 10)
const s = <T,>(a: Omit<T, 'id'>[]) => a.map(x => ({ ...x, id: uid() })) as unknown as T[]

// Стартовые данные: только то, что Арсений сам сообщил. Значения прогресса — стартовые, не измерения.
// Этот набор используется как контент по умолчанию, пока в data/content.json ничего не сохранено.
export const SEED = {
  about: s<About>([
    { text: 'Мне 16 лет, я живу в Севастополе и учусь в 10 классе.' },
    { text: 'Сейчас я в том возрасте, когда ещё можно пробовать много разных вещей и не бояться менять направление. Поэтому я изучаю AI и программирование, пробую создавать проекты, учусь продавать, занимаюсь спортом и собираю своё понимание того, чем хочу заниматься дальше.' },
    { text: 'Я пока не знаю точного ответа. И именно поэтому мне интересно наблюдать за своим развитием.' }]),
  timeline: s<Timeline>([
    { period: '15 лет', title: 'Первая работа', text: 'Фотограф в детском аквапарке. Первый опыт работы и общения с людьми.' },
    { period: 'Следующий этап', title: 'Кафе', text: 'Работа поваром. Другой ритм, другая ответственность и новый опыт.' },
    { period: '2026', title: 'Поиск своего направления', text: 'Начинаю пробовать онлайн-продажи, перепродажу товаров, AI и автоматизацию.' },
    { period: 'Сейчас', title: 'Строю фундамент', text: 'Изучаю Python, AI, AI-агентов, продажи, английский и чтение. Занимаюсь: зал, плавание.' },
    { period: 'Дальше', title: 'Собственные проекты', text: 'AI-агенты, автоматизации, игры, цифровые проекты и собственные источники дохода.' }]),
  goals: s<Goal>([
    { area: 'Финансы', text: 'Ближайший этап: 50 000 ₽+ стабильного дохода в месяц.' },
    { area: 'Развитие', text: 'Память, речь, мышление, концентрация, привычка читать.' },
    { area: 'Технологии', text: 'Python, AI, AI-агенты, автоматизация, разработка игр.' },
    { area: 'Спорт', text: 'Тренажёрный зал, плавание, физическая форма.' },
    { area: 'English', text: 'Постепенно улучшать английский для будущей учёбы и работы.' },
    { area: 'Путешествия', text: 'Побывать в разных странах и однажды не привязывать жизнь к одному месту.' }]),
  skills: s<Skill>([
    { name: 'Python', level: 'BEGINNER', value: 4 }, { name: 'AI', level: 'BEGINNER', value: 5 },
    { name: 'Sales', level: 'BEGINNER', value: 3 }, { name: 'English', level: 'B1 / развиваю', value: 4 },
    { name: 'Automation', level: 'BEGINNER', value: 3 }, { name: 'Content', level: 'Изучаю', value: 2 },
    { name: 'Reading', level: 'Привычка только строится', value: 2 }, { name: 'Sport', level: 'Развиваю', value: 4 }]),
  projects: s<Project>([
    { name: 'AI Agent', status: 'IN PROGRESS', date: '2026', text: 'Собственный AI-агент для автоматизации задач.', tech: 'Python, LLM API', progress: 20 },
    { name: 'Яндекс Игра', status: 'IDEA', date: '2026', text: 'Разработка собственной игры для Яндекс Игр.', tech: 'HTML5, JavaScript', progress: 0 },
    { name: 'Avito Resale', status: 'EXPERIMENT', date: '2026', text: 'Первые эксперименты с онлайн-продажами и перепродажей.', tech: 'Avito, продажи', progress: 10 },
    { name: 'Personal Website', status: 'BUILDING', date: '2026', text: 'Этот сайт — первая версия моего цифрового дневника.', tech: 'Next.js, TypeScript, GSAP, Three.js', progress: 40 }]),
  books: [] as Book[],
  notes: s<Note>([{ date: '02.10.2026', category: 'Мысли', title: 'Почему я вообще решил вести этот сайт?', text: 'Хочу сохранить точку старта и посмотреть, куда приведёт мой путь.' }]),
  finance: [] as Finance[],
  workouts: [] as Workout[],
  social: s<Social>([
    { label: 'Telegram', url: 'https://t.me/YOUR_TELEGRAM' }, { label: 'TikTok', url: 'https://tiktok.com/@YOUR_TIKTOK' },
    { label: 'YouTube', url: 'https://youtube.com/@YOUR_YOUTUBE' }]),
}

export type Key = keyof typeof SEED
export const KEYS = Object.keys(SEED) as Key[]
export type Rows = Id & Record<string, any>
export type Content = Record<Key, Rows[]>

/** Контент по умолчанию, когда на сервере ещё ничего не сохранено. */
export const seedContent = (): Content => {
  const out = {} as Content
  for (const k of KEYS) out[k] = SEED[k] as unknown as Rows[]
  return out
}

// --- Описание полей для админки -------------------------------------------------

export type Field = {
  n: string                                   // имя поля в данных
  l: string                                   // подпись для человека
  t: 'text' | 'number' | 'area' | readonly string[]
  labels?: Record<string, string>             // человеческие названия для списков
  hint?: string
  max?: number
}
export const isOpts = (t: Field['t']): t is readonly string[] => Array.isArray(t)

export const SCHEMA: Record<Key, { label: string; fields: Field[] }> = {
  about: { label: 'Обо мне', fields: [
    { n: 'text', l: 'Абзац текста', t: 'area' }] },
  timeline: { label: 'Путь (таймлайн)', fields: [
    { n: 'period', l: 'Период', t: 'text', hint: 'Например: 15 лет, 2026, Сейчас' },
    { n: 'title', l: 'Заголовок', t: 'text' },
    { n: 'text', l: 'Описание', t: 'area' }] },
  goals: { label: 'Цели', fields: [
    { n: 'area', l: 'Область', t: 'text', hint: 'Финансы, Спорт, English…' },
    { n: 'text', l: 'Цель', t: 'area' }] },
  skills: { label: 'Навыки и прогресс', fields: [
    { n: 'name', l: 'Навык', t: 'text' },
    { n: 'level', l: 'Подпись уровня', t: 'text' },
    { n: 'value', l: 'Прогресс (0–10)', t: 'number', max: 10 }] },
  projects: { label: 'Проекты', fields: [
    { n: 'name', l: 'Название', t: 'text' },
    { n: 'status', l: 'Статус', t: ['IDEA', 'EXPERIMENT', 'BUILDING', 'IN PROGRESS', 'DONE'],
      labels: { IDEA: 'Идея', EXPERIMENT: 'Эксперимент', BUILDING: 'Собираю', 'IN PROGRESS': 'В работе', DONE: 'Готово' } },
    { n: 'date', l: 'Дата', t: 'text' },
    { n: 'text', l: 'Описание', t: 'area' },
    { n: 'tech', l: 'Технологии', t: 'text' },
    { n: 'progress', l: 'Прогресс, %', t: 'number', max: 100 }] },
  books: { label: 'Книги', fields: [
    { n: 'title', l: 'Название', t: 'text' },
    { n: 'author', l: 'Автор', t: 'text' },
    { n: 'status', l: 'Статус', t: ['want', 'reading', 'done'], labels: { want: 'Хочу прочитать', reading: 'Читаю', done: 'Прочитано' } },
    { n: 'percent', l: 'Прочитано, %', t: 'number', max: 100 },
    { n: 'note', l: 'Заметка', t: 'area' }] },
  notes: { label: 'Заметки', fields: [
    { n: 'date', l: 'Дата', t: 'text', hint: 'Например: 02.10.2026' },
    { n: 'category', l: 'Категория', t: ['AI', 'Учёба', 'Работа', 'Спорт', 'Книги', 'Мысли', 'Проекты'] },
    { n: 'title', l: 'Заголовок', t: 'text' },
    { n: 'text', l: 'Текст', t: 'area' }] },
  workouts: { label: 'Тренировки', fields: [
    { n: 'date', l: 'Дата и время', t: 'text', hint: 'Формат: 2026-10-02T18:30:00.000Z' },
    { n: 'kind', l: 'Тип', t: ['gym', 'swim'], labels: { gym: 'Зал', swim: 'Плавание' } }] },
  finance: { label: 'Финансы (приватно)', fields: [
    { n: 'month', l: 'Месяц', t: 'text', hint: 'Например: Октябрь 2026' },
    { n: 'income', l: 'Доход, ₽', t: 'number' },
    { n: 'expense', l: 'Расход, ₽', t: 'number' },
    { n: 'sales', l: 'Продаж', t: 'number' }] },
  social: { label: 'Ссылки', fields: [
    { n: 'label', l: 'Название', t: 'text' },
    { n: 'url', l: 'Ссылка', t: 'text', hint: 'https://…' }] },
}
