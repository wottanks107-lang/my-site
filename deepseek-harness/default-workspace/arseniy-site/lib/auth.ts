// Простая авторизация владельца сайта: пароль из переменной окружения,
// подписанная cookie-сессия. Только серверный код.
import crypto from 'node:crypto'
import { cookies } from 'next/headers'

export const COOKIE = 'ars_admin'
const DAYS = 30

const secret = () => process.env.AUTH_SECRET || 'dev-only-secret-change-me'
export const adminPassword = () => process.env.ADMIN_PASSWORD || 'arseniy2026'

const sign = (payload: string) => crypto.createHmac('sha256', secret()).update(payload).digest('base64url')

/** Токен вида "<срок годности>.<подпись>". */
export function makeToken(days = DAYS): string {
  const payload = String(Date.now() + days * 86_400_000)
  return payload + '.' + sign(payload)
}

export function verifyToken(token?: string): boolean {
  if (!token) return false
  const i = token.lastIndexOf('.')
  if (i < 1) return false
  const payload = token.slice(0, i)
  const given = Buffer.from(token.slice(i + 1))
  const expected = Buffer.from(sign(payload))
  if (given.length !== expected.length) return false
  if (!crypto.timingSafeEqual(given, expected)) return false
  return Number(payload) > Date.now()
}

/** Сравнение пароля без утечки длины по времени. */
export function checkPassword(value: string): boolean {
  const a = Buffer.from(value)
  const b = Buffer.from(adminPassword())
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function isAuthed(): Promise<boolean> {
  const jar = await cookies()
  return verifyToken(jar.get(COOKIE)?.value)
}
