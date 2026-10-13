// Настройки доступа к Supabase. Только серверный код.
//
// SERVICE ROLE KEY даёт полный доступ к базе и обходит RLS, поэтому он
// используется исключительно на сервере и никогда не попадает в браузер:
// в клиентских компонентах его нет, и он не назван с префиксом NEXT_PUBLIC_.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

/** Публичный ключ. В новых проектах Supabase называется publishable key. */
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ''

export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

/** Настроено ли серверное подключение (для чтения публичных данных хватит и anon-ключа). */
export const isSupabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

/** Настроено ли подключение с правами записи. */
export const isSupabaseWritable = () => Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)

export const SUPABASE_SETUP_HINT =
  'Supabase не настроен. Заполни NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ' +
  'и SUPABASE_SERVICE_ROLE_KEY в файле .env.local и перезапусти сервер.'

export const STORAGE_BUCKET = 'site-assets'
