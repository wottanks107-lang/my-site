// Медиа: записи о загруженных файлах в Supabase Storage.
//
// Сама загрузка лежит в lib/services/storage.ts, здесь — учёт файлов,
// чтобы в админке был список загруженного и можно было удалять.
import { adminClient } from '../supabase/client'
import { many, nothing } from './errors'
import { STORAGE_BUCKET } from '../supabase/config'
import type { MediaItem } from '../types'

const TABLE = 'media'

export function listMedia(folder?: string): Promise<MediaItem[]> {
  let query = adminClient().from(TABLE).select('*').order('created_at', { ascending: false })
  if (folder) query = query.eq('folder', folder)
  return many<MediaItem>(TABLE, query)
}

/** Сохранить запись о файле, который уже лежит в Storage. */
export async function recordMedia(input: {
  path: string
  url: string
  kind?: MediaItem['kind']
  mime?: string | null
  size?: number | null
  folder?: string | null
}): Promise<MediaItem> {
  const { data, error } = await adminClient().from(TABLE).insert({
    bucket: STORAGE_BUCKET,
    path: input.path,
    url: input.url,
    kind: input.kind ?? 'image',
    mime: input.mime ?? null,
    size_bytes: input.size ?? null,
    folder: input.folder ?? null,
  }).select().single()
  if (error) throw new Error(`${TABLE}: ${error.message}`)
  return data as MediaItem
}

/** Удаляет файл из Storage и его запись. */
export async function deleteMedia(item: MediaItem): Promise<void> {
  const db = adminClient()
  await db.storage.from(item.bucket || STORAGE_BUCKET).remove([item.path])
  await nothing(TABLE, db.from(TABLE).delete().eq('id', item.id))
}
