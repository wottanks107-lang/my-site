import { NextResponse } from 'next/server'
import { COOKIE, checkPassword, makeToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { password?: unknown } | null
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!checkPassword(password)) {
    return NextResponse.json({ ok: false, error: 'Неверный пароль' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
