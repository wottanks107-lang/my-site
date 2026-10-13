// Серверные клиенты Supabase.
//
// Клиентского (браузерного) клиента здесь нет намеренно: все чтения идут
// в серверных компонентах, все записи — через route handlers. Поэтому
// service_role key физически не может оказаться в бандле браузера.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
import {
  SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SETUP_HINT, SUPABASE_URL,
  isSupabaseConfigured, isSupabaseWritable,
} from './config'

let admin: SupabaseClient | null = null
let reader: SupabaseClient | null = null

// Realtime в проекте не используется, но supabase-js создаёт RealtimeClient
// прямо в createClient и на Node < 22 падает без глобального WebSocket.
// Поэтому явно передаём реализацию из пакета ws.
// Импорт 'ws' заодно служит защитой: если этот модуль случайно попадёт
// в клиентский бандл, сборка упадёт и секретный ключ не утечёт в браузер.
const options = {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: WebSocket as never },
} as const

/** Клиент с полными правами. Только для операций записи на сервере. */
export function adminClient(): SupabaseClient {
  if (!isSupabaseWritable()) throw new Error(SUPABASE_SETUP_HINT)
  if (!admin) admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, options)
  return admin
}

/** Клиент с публичным ключом. Для чтения публичных данных. */
export function readClient(): SupabaseClient {
  if (!isSupabaseConfigured()) throw new Error(SUPABASE_SETUP_HINT)
  if (!reader) reader = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options)
  return reader
}
