// Источник публичных данных сайта.
//
// Если Supabase настроен — читаем из базы через репозитории.
// Если ещё нет (или миграции не выполнены) — собираем те же структуры
// из data/content.json. Благодаря этому сайт не гаснет во время переезда,
// а новый интерфейс можно писать и проверять до появления ключей.
import { cache } from 'react'
import { readContent } from './content'
import { isSupabaseConfigured } from './supabase/config'
import {
  getPublicProfile, getPublicSettings, listPublicBooks, listPublicProjects,
  listPublicSkills, listPublicSocialLinks, listPublicTimeline,
} from './repositories'
import { slugify } from './slug'
import type {
  Book, BookStatus, Profile, Project, ProjectStatus, SiteSettings, Skill, SocialLink, TimelineEvent,
} from './types'

export type PublicSite = {
  source: 'supabase' | 'file'
  profile: Profile
  settings: SiteSettings
  social: SocialLink[]
  timeline: TimelineEvent[]
  skills: Skill[]
  projects: Project[]
  books: Book[]
}

export function defaultProfile(): Profile {
  return {
    id: 1,
    name: 'Арсений',
    age: 16,
    city: 'Севастополь',
    tagline: 'Учусь, создаю проекты и ищу своё направление.',
    short_bio: 'Мне 16 лет, я живу в Севастополе и учусь в 10 классе.',
    bio_paragraphs: [],
    status: 'Учусь в 10 классе, изучаю AI и программирование, пробую продажи и создаю проекты.',
    directions: ['AI', 'CODE', 'BUSINESS', 'SPORT'],
    email: null,
    photo_url: null,
    photo_position: 'center',
    hero_bg_url: null,
    primary_button_label: 'Мои проекты',
    secondary_button_label: 'Открыть Dashboard',
  }
}

export function defaultSettings(): SiteSettings {
  return {
    id: 1,
    site_title: 'Arseniy — My Journey',
    site_description: 'Личный сайт Арсения. AI, code, business, sport, development and life.',
    og_image_url: null,
    accent_color: '#E5202E',
  }
}

/** --- чтение из файла: старые структуры → новые ---------------------------- */

type FileAbout = { id: string; text: string }
type FileTimeline = { id: string; period: string; title: string; text: string }
type FileSkill = { id: string; name: string; level: string; value: number }
type FileProject = { id: string; name: string; status: string; date: string; text: string; tech: string; progress: number }
type FileBook = { id: string; title: string; author: string; status: string; percent: number; note: string }
type FileSocial = { id: string; label: string; url: string }

const PROJECT_STATUS: Record<string, ProjectStatus> = {
  idea: 'idea', experiment: 'experiment', building: 'building',
  'in progress': 'in_progress', in_progress: 'in_progress', paused: 'paused', done: 'done',
}
const BOOK_STATUS: Record<string, BookStatus> = { want: 'want', reading: 'reading', done: 'done', dropped: 'dropped' }

async function fromFile(): Promise<PublicSite> {
  const content = await readContent()
  const about = content.about as unknown as FileAbout[]
  const timeline = content.timeline as unknown as FileTimeline[]
  const skills = content.skills as unknown as FileSkill[]
  const projects = content.projects as unknown as FileProject[]
  const books = content.books as unknown as FileBook[]
  const social = content.social as unknown as FileSocial[]

  const profile = defaultProfile()
  profile.bio_paragraphs = about.map(a => a.text)
  profile.short_bio = about[0]?.text ?? profile.short_bio

  return {
    source: 'file',
    profile,
    settings: defaultSettings(),
    social: social.map((s, i) => ({
      id: s.id, label: s.label, url: s.url, icon: null, username: null, sort_order: i, is_public: true,
    })),
    timeline: timeline.map((e, i) => ({
      id: e.id, period: e.period, title: e.title, body: e.text, sort_order: i, is_public: true,
    })),
    skills: skills.map((s, i) => ({
      id: s.id, name: s.name, level: s.level, value: s.value, sort_order: i, is_public: true,
    })),
    projects: projects.map((p, i) => ({
      id: p.id,
      slug: slugify(p.name, `project-${i + 1}`),
      title: p.name,
      summary: p.text,
      description: p.text,
      status: PROJECT_STATUS[String(p.status || '').toLowerCase()] ?? 'idea',
      progress: Math.min(100, Math.max(0, Number(p.progress) || 0)),
      tech: String(p.tech || '').split(',').map(t => t.trim()).filter(Boolean),
      github_url: null,
      demo_url: null,
      cover_url: null,
      started_on: null,
      period_label: p.date ?? null,
      is_public: true,
      sort_order: i,
    })),
    books: books.map((b, i) => ({
      id: b.id, title: b.title, author: b.author, status: BOOK_STATUS[String(b.status || '').toLowerCase()] ?? 'want',
      percent: Number(b.percent) || 0, rating: null, note: b.note, cover_url: null,
      started_on: null, finished_on: null, is_public: true, sort_order: i,
    })),
  }
}

/**
 * Публичные данные сайта.
 *
 * Обёрнуто в cache(): layout и страница вызывают функцию в одном запросе,
 * а обращение к данным происходит один раз.
 */
export const getPublicSite = cache(async (): Promise<PublicSite> => {
  if (isSupabaseConfigured()) {
    try {
      const [profile, settings, social, timeline, skills, projects, books] = await Promise.all([
        getPublicProfile(), getPublicSettings(), listPublicSocialLinks(),
        listPublicTimeline(), listPublicSkills(), listPublicProjects(), listPublicBooks(),
      ])
      if (profile) {
        return {
          source: 'supabase',
          profile,
          settings: settings ?? defaultSettings(),
          social, timeline, skills, projects, books,
        }
      }
      // Профиля нет — значит миграции ещё не выполнены или данные не перенесены.
    } catch {
      // База недоступна или схема не создана — отдаём данные из файла.
    }
  }
  return fromFile()
})
