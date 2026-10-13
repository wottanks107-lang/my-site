import { NextResponse } from 'next/server'
import { readContent, writeCollection } from '@/lib/content'
import { isAuthed } from '@/lib/auth'
import { KEYS, Key, Rows } from '@/lib/schema'

export const dynamic = 'force-dynamic'

/** Публичное чтение контента сайта. */
export async function GET() {
  return NextResponse.json(await readContent())
}

/** Запись коллекции. Только для вошедшего владельца. */
export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: 'Нужно войти в админку заново' }, { status: 401 })
  }
  const body = (await req.json().catch(() => null)) as { key?: unknown; rows?: unknown } | null
  if (!body || typeof body.key !== 'string' || !KEYS.includes(body.key as Key) || !Array.isArray(body.rows)) {
    return NextResponse.json({ ok: false, error: 'Некорректный запрос' }, { status: 400 })
  }
  try {
    await writeCollection(body.key as Key, body.rows as Rows[])
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'неизвестная ошибка'
    return NextResponse.json({ ok: false, error: 'Не удалось записать файл: ' + msg }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
