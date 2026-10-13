#!/usr/bin/env node
// ============================================================================
//  Перенос данных из data/content.json в Supabase.
//
//  Запуск:  npm run migrate            (переносит данные)
//           npm run migrate -- --dry-run   (только показать, что будет сделано)
//
//  Требует заполненные NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY
//  в .env.local и выполненные миграции из supabase/migrations.
//
//  Скрипт идемпотентный: перед вставкой таблицы очищаются, поэтому его можно
//  запускать повторно. Данные в Supabase будут перезаписаны этим файлом.
// ============================================================================
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import nextEnv from '@next/env'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const DRY = process.argv.includes('--dry-run')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('\n✖ Не настроен Supabase.')
  console.error('  Заполни в .env.local: NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY\n')
  process.exit(1)
}

const FILE = path.join(process.cwd(), 'data', 'content.json')
if (!existsSync(FILE)) {
  console.error(`\n✖ Не найден ${FILE}`)
  console.error('  Запусти сайт, зайди в админку и сохрани любую запись — файл создастся.\n')
  process.exit(1)
}

const content = JSON.parse(readFileSync(FILE, 'utf8'))
const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: WebSocket },
})

// --- помощники --------------------------------------------------------------

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

function slugify(value, fallback) {
  const base = String(value || '')
    .toLowerCase()
    .split('')
    .map(ch => TRANSLIT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || fallback
}

/** «02.10.2026» → «2026-10-02» */
function fromRuDate(value) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(value || '').trim())
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null
}

/** ISO-строка → «2026-10-02» */
function isoDate(value) {
  const s = String(value || '')
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null
}

/** ISO-строка → «18:30:00» */
function isoTime(value) {
  const s = String(value || '')
  const m = /T(\d{2}:\d{2})(:\d{2})?/.exec(s)
  return m ? `${m[1]}:${m[2] ? m[2].slice(1) : '00'}` : null
}

const PROJECT_STATUS = {
  idea: 'idea', experiment: 'experiment', building: 'building',
  'in progress': 'in_progress', in_progress: 'in_progress', paused: 'paused', done: 'done',
}
const BOOK_STATUS = { want: 'want', reading: 'reading', done: 'done', dropped: 'dropped' }
const WORKOUT_KIND = { gym: 'gym', swim: 'swim', run: 'run', home: 'home' }

const list = key => (Array.isArray(content[key]) ? content[key] : [])

let planned = 0

async function insert(table, rows) {
  if (!rows.length) {
    console.log(`   ${table.padEnd(22)} —`)
    return []
  }
  if (DRY) {
    planned += rows.length
    console.log(`   ${table.padEnd(22)} ${rows.length}`)
    return rows.map((_, i) => ({ id: `dry-${table}-${i}` }))
  }
  const { data, error } = await db.from(table).insert(rows).select('id')
  if (error) throw new Error(`${table}: ${error.message}`)
  console.log(`   ${table.padEnd(22)} ${data.length}`)
  return data
}

async function wipe(table) {
  if (DRY) return
  const { error } = await db.from(table).delete().not('id', 'is', null)
  // Таблица profiles/site_settings имеет числовой id — там фильтр другой.
  if (error && !/invalid input syntax/.test(error.message)) {
    throw new Error(`очистка ${table}: ${error.message}`)
  }
}

async function main() {
  console.log(`\n${DRY ? 'Проверка (--dry-run)' : 'Перенос данных'} → ${url}\n`)

  const counts = {
    about: list('about').length, timeline: list('timeline').length, goals: list('goals').length,
    skills: list('skills').length, projects: list('projects').length, books: list('books').length,
    notes: list('notes').length, finance: list('finance').length, workouts: list('workouts').length,
    social: list('social').length,
  }
  console.log('   Источник data/content.json:')
  for (const [k, v] of Object.entries(counts)) console.log(`     ${k}: ${v}`)
  console.log('\n   Запись в Supabase:')

  // Чистим в порядке «дети → родители», чтобы не мешали внешние ключи.
  for (const t of [
    'workout_exercises', 'workouts', 'homework_checklist', 'homework', 'note_tags', 'notes',
    'goal_tasks', 'goals', 'project_tasks', 'project_media', 'project_changelog', 'projects',
    'books', 'skills', 'timeline_events', 'social_links', 'finance_months', 'media',
  ]) {
    await wipe(t)
  }

  // --- профиль и настройки --------------------------------------------------
  const aboutTexts = list('about').map(a => a.text).filter(Boolean)
  if (!DRY) {
    const { error } = await db.from('profiles').upsert({
      id: 1,
      name: 'Арсений',
      age: 16,
      city: 'Севастополь',
      tagline: 'Учусь, создаю проекты и ищу своё направление.',
      short_bio: aboutTexts[0] ?? null,
      bio_paragraphs: aboutTexts,
      status: 'Учусь в 10 классе, изучаю AI и программирование, пробую продажи и создаю проекты.',
      directions: ['AI', 'CODE', 'BUSINESS', 'SPORT'],
      primary_button_label: 'Мои проекты',
      secondary_button_label: 'Открыть Dashboard',
    })
    if (error) throw new Error(`profiles: ${error.message}`)
    await db.from('site_settings').upsert({ id: 1 })
    console.log(`   ${'profiles'.padEnd(22)} 1`)
    console.log(`   ${'site_settings'.padEnd(22)} 1`)
  } else {
    console.log(`   ${'profiles'.padEnd(22)} 1`)
    console.log(`   ${'site_settings'.padEnd(22)} 1`)
  }

  // --- простые коллекции ----------------------------------------------------
  await insert('social_links', list('social').map((s, i) => ({
    label: s.label, url: s.url, sort_order: i, is_public: true,
  })))

  await insert('timeline_events', list('timeline').map((e, i) => ({
    period: e.period, title: e.title, body: e.text ?? null, sort_order: i, is_public: true,
  })))

  await insert('skills', list('skills').map((s, i) => ({
    name: s.name, level: s.level ?? null, value: Number(s.value) || 0, sort_order: i, is_public: true,
  })))

  const projects = await insert('projects', list('projects').map((p, i) => ({
    slug: slugify(p.name, `project-${i + 1}`),
    title: p.name,
    summary: p.text ?? null,
    description: p.text ?? null,
    status: PROJECT_STATUS[String(p.status || '').toLowerCase()] ?? 'idea',
    progress: Math.min(100, Math.max(0, Number(p.progress) || 0)),
    tech: String(p.tech || '').split(',').map(t => t.trim()).filter(Boolean),
    period_label: p.date ?? null,
    is_public: true,
    sort_order: i,
  })))

  await insert('books', list('books').map((b, i) => ({
    title: b.title, author: b.author ?? null,
    status: BOOK_STATUS[String(b.status || '').toLowerCase()] ?? 'want',
    percent: Math.min(100, Math.max(0, Number(b.percent) || 0)),
    note: b.note ?? null, is_public: true, sort_order: i,
  })))

  const notes = await insert('notes', list('notes').map(n => ({
    title: n.title, body: n.text ?? null, category: n.category ?? null,
    note_date: fromRuDate(n.date) ?? new Date().toISOString().slice(0, 10),
    is_public: false,
  })))
  if (!DRY && notes.length) {
    const tags = list('notes').flatMap((n, i) => (n.category ? [{ note_id: notes[i].id, tag: n.category }] : []))
    await insert('note_tags', tags)
  }

  const goals = await insert('goals', list('goals').map((g, i) => ({
    title: g.area || 'Цель', category: g.area ?? null, description: g.text ?? null,
    status: 'not_started', progress: 0, is_public: false, sort_order: i,
  })))

  await insert('workouts', list('workouts').map(w => ({
    workout_date: isoDate(w.date) ?? new Date().toISOString().slice(0, 10),
    workout_time: isoTime(w.date),
    kind: WORKOUT_KIND[w.kind] ?? 'gym',
  })))

  await insert('finance_months', list('finance').map(f => ({
    month: f.month, income: Number(f.income) || 0, expense: Number(f.expense) || 0, sales: Number(f.sales) || 0,
  })))

  console.log('\n✔ Готово.')
  if (DRY) console.log(`  Будет перенесено строк: ${planned + 2} (плюс профиль и настройки). Запусти без --dry-run.\n`)
  else console.log('  Проверь сайт: публичная часть читает профиль, проекты и соцсети из Supabase.\n')
}

main().catch(err => {
  console.error(`\n✖ Ошибка: ${err.message}\n`)
  process.exit(1)
})
