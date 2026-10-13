#!/usr/bin/env node
// ============================================================================
//  Проверка базы и доступов. Запуск: npm run check:db
//
//  Что проверяет:
//    1. все таблицы из миграций существуют;
//    2. публичные данные читаются анонимным ключом;
//    3. ПРИВАТНЫЕ данные анонимным ключом недоступны (ни одной строки);
//    4. анонимный ключ не может ничего записать — даже в публичную таблицу;
//    5. bucket site-assets существует и публичен на чтение.
//
//  Ничего не меняет в базе (кроме попытки запрещённой вставки, которую
//  в случае успеха сразу удаляет).
// ============================================================================
import nextEnv from '@next/env'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anonKey || !serviceKey) {
  console.error('\n✖ Нужны все три переменные: NEXT_PUBLIC_SUPABASE_URL,')
  console.error('  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY и SUPABASE_SERVICE_ROLE_KEY.\n')
  process.exit(1)
}

const options = { auth: { persistSession: false, autoRefreshToken: false }, realtime: { transport: WebSocket } }
const anon = createClient(url, anonKey, options)
const admin = createClient(url, serviceKey, options)

const PUBLIC_TABLES = ['profiles', 'site_settings', 'social_links', 'timeline_events', 'skills', 'projects', 'books']
const PRIVATE_TABLES = ['schedule_events', 'homework', 'homework_checklist', 'notes', 'note_tags', 'goals',
  'goal_tasks', 'workouts', 'workout_exercises', 'finance_months', 'media']
const ALL_TABLES = [...PUBLIC_TABLES, ...PRIVATE_TABLES]

let failures = 0
const ok = label => console.log(`   ✓ ${label}`)
const bad = (label, detail) => { failures++; console.log(`   ✗ ${label}${detail ? ` — ${detail}` : ''}`) }
const head = label => console.log(`\n${label}`)

async function main() {
  console.log(`\nПроверка Supabase → ${url}`)

  // --- 1. Схема -------------------------------------------------------------
  head('Схема базы (service_role):')
  for (const table of ALL_TABLES) {
    const { error } = await admin.from(table).select('id').limit(1)
    if (error) bad(table, error.message)
  }
  if (!failures) ok(`все ${ALL_TABLES.length} таблиц на месте`)

  // --- 2. Публичное чтение --------------------------------------------------
  head('Публичное чтение анонимным ключом:')
  for (const table of PUBLIC_TABLES) {
    const { data, error } = await anon.from(table).select('*').limit(50)
    if (error) bad(table, error.message)
    else ok(`${table} — ${data.length} строк`)
  }

  // --- 3. Приватное закрыто -------------------------------------------------
  head('Приватные таблицы анонимным ключом (ожидаем 0 строк):')
  for (const table of PRIVATE_TABLES) {
    const { data, error } = await anon.from(table).select('*').limit(5)
    if (error) {
      // Ошибка доступа — тоже приемлемый результат: данные закрыты.
      ok(`${table} — доступ отклонён (${error.code ?? error.message})`)
    } else if (data.length === 0) {
      ok(`${table} — 0 строк`)
    } else {
      bad(table, `УТЕЧКА: анонимный ключ видит ${data.length} строк`)
    }
  }

  // --- 4. Запись анонимно запрещена ----------------------------------------
  head('Запись анонимным ключом (ожидаем отказ):')
  const publicInsert = await anon.from('social_links').insert({ label: '__rls_check__', url: 'https://example.com' }).select()
  if (publicInsert.error) ok('social_links — вставка отклонена')
  else {
    bad('social_links', 'анонимный ключ смог записать в публичную таблицу')
    for (const row of publicInsert.data ?? []) await admin.from('social_links').delete().eq('id', row.id)
  }

  const privateInsert = await anon.from('notes').insert({ title: '__rls_check__' }).select()
  if (privateInsert.error) ok('notes — вставка отклонена')
  else {
    bad('notes', 'анонимный ключ смог записать в приватную таблицу')
    for (const row of privateInsert.data ?? []) await admin.from('notes').delete().eq('id', row.id)
  }

  // --- 5. Запись секретным ключом разрешена (он обходит RLS) ---------------
  head('Запись секретным ключом (ожидаем успех):')
  const writeTest = await admin.from('notes').insert({ title: '__check_write__', is_public: false }).select()
  if (writeTest.error) bad('notes', `секретный ключ не может писать: ${writeTest.error.message}`)
  else {
    ok('notes — вставка прошла, RLS обойдён')
    for (const row of writeTest.data ?? []) await admin.from('notes').delete().eq('id', row.id)
  }

  // --- 6. Storage -----------------------------------------------------------
  head('Storage:')
  const buckets = await admin.storage.listBuckets()
  if (buckets.error) bad('storage', buckets.error.message)
  else {
    const bucket = (buckets.data ?? []).find(b => b.id === 'site-assets')
    if (!bucket) bad('site-assets', 'bucket не найден — выполни 0003_storage.sql')
    else if (!bucket.public) bad('site-assets', 'bucket не публичный, картинки не откроются по URL')
    else ok('site-assets — есть, публичный на чтение')
  }

  // --- 6b. Загрузка изображения и публичное чтение -------------------------
  head('Загрузка изображения в Storage:')
  const testPath = `profile/__check-${Date.now()}.png`
  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
    'base64',
  )

  const upload = await admin.storage.from('site-assets').upload(testPath, pixel, { contentType: 'image/png' })
  if (upload.error) bad('загрузка файла', upload.error.message)
  else {
    const { data } = admin.storage.from('site-assets').getPublicUrl(testPath)
    const response = await fetch(data.publicUrl)
    if (response.ok) ok(`файл загружен и открывается по ссылке (HTTP ${response.status})`)
    else bad('публичное чтение файла', `HTTP ${response.status}`)
    await admin.storage.from('site-assets').remove([testPath])
  }

  const anonymousUpload = await anon.storage.from('site-assets').upload(`profile/__anon-${Date.now()}.png`, pixel, { contentType: 'image/png' })
  if (anonymousUpload.error) ok('анонимный ключ не может загружать файлы')
  else {
    bad('storage', 'УТЕЧКА: анонимный ключ смог загрузить файл')
    await admin.storage.from('site-assets').remove([anonymousUpload.data.path])
  }

  // --- 7. Создание, изменение, удаление по разделам ------------------------
  head('CRUD по разделам (секретный ключ):')
  const CRUD = [
    ['goals', { title: '__check__', is_public: false }, { progress: 42 }],
    ['projects', { slug: `__check-${Date.now()}`, title: '__check__' }, { progress: 7 }],
    ['notes', { title: '__check__' }, { pinned: true }],
    ['homework', { subject: '__check__' }, { status: 'in_progress' }],
    ['schedule_events', { title: '__check__', day_of_week: 1, start_time: '08:00', repeat: 'weekly' }, { end_time: '09:00' }],
    ['workouts', { kind: 'gym' }, { duration_min: 60 }],
    ['books', { title: '__check__' }, { percent: 10 }],
    ['social_links', { label: '__check__', url: 'https://example.com' }, { sort_order: 9 }],
    ['timeline_events', { period: '__check__', title: '__check__' }, { body: 'x' }],
    ['skills', { name: '__check__' }, { value: 5 }],
    ['finance_months', { month: '__check__' }, { income: 1 }],
  ]

  // Postgres отдаёт time как «09:00:00», поэтому строгое сравнение не подходит.
  const same = (actual, expected) =>
    typeof actual === 'number' || typeof expected === 'number'
      ? Number(actual) === Number(expected)
      : String(actual) === String(expected) || String(actual).startsWith(String(expected))

  for (const [table, create, patch] of CRUD) {
    const created = await admin.from(table).insert(create).select().single()
    if (created.error) { bad(table, `создание: ${created.error.message}`); continue }

    const updated = await admin.from(table).update(patch).eq('id', created.data.id).select().single()
    if (updated.error) { bad(table, `изменение: ${updated.error.message}`); continue }

    const removed = await admin.from(table).delete().eq('id', created.data.id)
    if (removed.error) { bad(table, `удаление: ${removed.error.message}`); continue }

    const changed = Object.entries(patch).every(([key, value]) => same(updated.data[key], value))
    if (!changed) { bad(table, 'изменение не применилось'); continue }

    ok(`${table} — создание, изменение, удаление`)
  }

  // Внешний ключ с каскадом: подзадачи должны уйти вместе с целью.
  const cascadeGoal = await admin.from('goals').insert({ title: '__check_cascade__' }).select().single()
  if (cascadeGoal.error) bad('goals', cascadeGoal.error.message)
  else {
    const task = await admin.from('goal_tasks').insert({ goal_id: cascadeGoal.data.id, title: '__check__' }).select().single()
    if (task.error) bad('goal_tasks', task.error.message)
    else {
      await admin.from('goals').delete().eq('id', cascadeGoal.data.id)
      const left = await admin.from('goal_tasks').select('id').eq('id', task.data.id)
      if ((left.data ?? []).length === 0) ok('goal_tasks — удаляются вместе с целью (каскад)')
      else {
        bad('goal_tasks', 'каскад не сработал')
        await admin.from('goal_tasks').delete().eq('id', task.data.id)
      }
    }
  }

  // --- 8. Данные перенесены? -----------------------------------------------
  head('Данные:')
  const { data: profile } = await admin.from('profiles').select('*').eq('id', 1).limit(1)
  if (!profile?.length) console.log('   • профиль ещё не создан — запусти npm run migrate')
  else ok(`профиль: ${profile[0].name ?? '—'}`)

  for (const table of ['projects', 'goals', 'skills', 'social_links']) {
    const { count } = await admin.from(table).select('id', { count: 'exact', head: true })
    console.log(`   • ${table}: ${count ?? 0}`)
  }

  console.log(failures ? `\n✖ Проблем: ${failures}\n` : '\n✔ Всё в порядке.\n')
  process.exit(failures ? 1 : 0)
}

main().catch(error => {
  console.error(`\n✖ Ошибка проверки: ${error.message}\n`)
  process.exit(1)
})
