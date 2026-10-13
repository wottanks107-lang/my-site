// ВРЕМЕННЫЙ скрипт проверки расписания: добавляет тестовые события и умеет их убрать.
//   node .tmp-events.mjs seed
//   node .tmp-events.mjs clean
import nextEnv from '@next/env'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false }, realtime: { transport: WebSocket } },
)

const MARK = '__schedule_check__'
const mode = process.argv[2] ?? 'seed'

if (mode === 'clean') {
  const { data, error } = await db.from('schedule_events').delete().like('title', `${MARK}%`).select('id')
  console.log(error ? `ошибка: ${error.message}` : `удалено событий: ${data?.length ?? 0}`)
} else {
  const rows = [
    { title: `${MARK} Школа`, repeat: 'weekdays', day_of_week: 1, start_time: '08:30', end_time: '14:00', category: 'Учёба', color: '#3B82F6', location: 'Школа' },
    { title: `${MARK} Python`, repeat: 'weekly', day_of_week: 2, start_time: '16:00', end_time: '17:30', category: 'Развитие', color: '#E5202E' },
    { title: `${MARK} Зал`, repeat: 'weekly', day_of_week: 4, start_time: '18:00', end_time: '19:30', category: 'Спорт', color: '#22C55E' },
    { title: `${MARK} Разовое`, repeat: 'none', event_date: new Date().toISOString().slice(0, 10), start_time: '20:00', category: 'Личное', color: '#F59E0B' },
  ]
  const { data, error } = await db.from('schedule_events').insert(rows).select('id, title')
  console.log(error ? `ошибка: ${error.message}` : `добавлено событий: ${data.length}`)
  for (const row of data ?? []) console.log(' •', row.title)
}
