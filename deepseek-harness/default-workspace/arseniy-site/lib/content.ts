// Серверный доступ к контенту. Только для серверных компонентов и route handlers.
//
// Сейчас данные лежат в data/content.json. Чтобы перейти на Supabase/Firebase,
// достаточно переписать только этот файл — readContent/writeCollection,
// остальной код (сайт, админка, API) не меняется.
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { KEYS, Key, Content, Rows, seedContent } from './schema'

const FILE = path.join(process.cwd(), 'data', 'content.json')

/** Читает контент. Чего нет в файле — берётся из стартовых данных. */
export async function readContent(): Promise<Content> {
  let stored: Partial<Record<Key, unknown>> = {}
  try {
    stored = JSON.parse(await fs.readFile(FILE, 'utf8')) as Partial<Record<Key, unknown>>
  } catch {
    // Файла ещё нет — работаем на стартовых данных, он появится при первом сохранении.
  }
  const base = seedContent()
  const out = {} as Content
  for (const k of KEYS) {
    const v = stored[k]
    out[k] = (Array.isArray(v) ? v : base[k]) as Rows[]
  }
  return out
}

/** Заменяет одну коллекцию целиком. */
export async function writeCollection(key: Key, rows: unknown[]): Promise<void> {
  const content = await readContent()
  content[key] = rows as Rows[]
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  await fs.writeFile(FILE, JSON.stringify(content, null, 2) + '\n', 'utf8')
}

export const contentFile = FILE
