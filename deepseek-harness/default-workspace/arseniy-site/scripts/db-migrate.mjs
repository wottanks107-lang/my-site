#!/usr/bin/env node
// ============================================================================
//  Применение SQL-миграций к базе Supabase.
//
//  Запуск: npm run db:migrate
//
//  Нужна переменная SUPABASE_DB_URL в .env.local — строка подключения
//  к Postgres (Project Settings → Database → Connection string → Session pooler).
//  Пароль в строке должен быть закодирован: @ → %40
//
//  Файлы идемпотентные, поэтому скрипт можно запускать повторно.
// ============================================================================
import nextEnv from '@next/env'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import pg from 'pg'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const connectionString = process.env.SUPABASE_DB_URL
if (!connectionString) {
  console.error('\n✖ Не задан SUPABASE_DB_URL в .env.local\n')
  process.exit(1)
}

const FILES = ['0001_schema.sql', '0002_rls.sql', '0003_storage.sql']
const DIR = path.join(process.cwd(), 'supabase', 'migrations')

const client = new pg.Client({
  connectionString,
  // В этом окружении TLS перехватывается, поэтому проверка цепочки отключена.
  // Трафик всё равно шифруется.
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  const { rows: who } = await client.query('select current_user as u, current_database() as d')
  console.log(`\nПодключено: ${who[0].u}@${who[0].d}`)

  for (const file of FILES) {
    const sql = await readFile(path.join(DIR, file), 'utf8')
    process.stdout.write(`   ${file.padEnd(20)} … `)
    await client.query(sql)
    console.log('ок')
  }

  // --- проверка результата -------------------------------------------------
  const { rows: tables } = await client.query(`
    select c.relname as name, c.relrowsecurity as rls
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by c.relname`)

  const { rows: policies } = await client.query(`
    select tablename, count(*)::int as n from pg_policies
    where schemaname = 'public' group by tablename`)

  const { rows: buckets } = await client.query(`select id, public from storage.buckets where id = 'site-assets'`)

  console.log(`\nТаблиц в public:      ${tables.length}`)
  console.log(`С включённым RLS:     ${tables.filter(t => t.rls).length}`)
  console.log(`Политик:              ${policies.reduce((sum, p) => sum + p.n, 0)}`)
  console.log(`Bucket site-assets:   ${buckets.length ? (buckets[0].public ? 'есть, публичный' : 'есть, приватный') : 'НЕТ'}`)

  const noRls = tables.filter(t => !t.rls).map(t => t.name)
  if (noRls.length) console.log(`\n⚠ Без RLS: ${noRls.join(', ')}`)
  else console.log('\n✔ RLS включён на всех таблицах.\n')
} catch (error) {
  console.error(`\n✖ Ошибка: ${error.message}\n`)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
