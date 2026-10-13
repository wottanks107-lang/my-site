// Загрузка файлов в Supabase Storage. Только серверный код.
//
// Файлы лежат в bucket site-assets, папки: profile, projects, notes, homework.
// После загрузки в таблицу media пишется запись — чтобы в админке был список
// загруженного и можно было удалять.
import { adminClient } from '../supabase/client'
import { STORAGE_BUCKET } from '../supabase/config'
import { recordMedia } from '../repositories/media'
import { DataError } from '../repositories/errors'

// Совпадает с настройками bucket из 0003_storage.sql.
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const MAX_BYTES = 8 * 1024 * 1024

export type UploadFolder = 'profile' | 'projects' | 'notes' | 'homework'

export type UploadedFile = { url: string; path: string; size: number; mime: string }

/** Похоже ли значение из FormData на загруженный файл. */
export function isUploadedFile(value: unknown): value is File {
  return typeof value === 'object' && value !== null
    && typeof (value as File).arrayBuffer === 'function'
    && typeof (value as File).size === 'number'
    && (value as File).size > 0
}

/** Проверяет файл и загружает его в Storage. Бросает DataError с понятным текстом. */
export async function uploadImage(file: File, folder: UploadFolder): Promise<UploadedFile> {
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new DataError(
      `Формат «${file.type || 'неизвестный'}» не поддерживается. Разрешены JPEG, PNG, WebP, GIF и AVIF.`,
    )
  }
  if (file.size > MAX_BYTES) {
    throw new DataError(`Файл больше ${Math.round(MAX_BYTES / 1024 / 1024)} МБ. Сожми его или уменьши размер.`)
  }

  const extension = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`

  const db = adminClient()
  const { error } = await db.storage
    .from(STORAGE_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false })

  if (error) throw new DataError(`Не удалось загрузить файл: ${error.message}`)

  const { data } = db.storage.from(STORAGE_BUCKET).getPublicUrl(path)

  // Запись в media не должна ломать загрузку — файл уже лежит в Storage.
  try {
    await recordMedia({ path, url: data.publicUrl, mime: file.type, size: file.size, folder })
  } catch {
    // молча: список медиа вторичен
  }

  return { url: data.publicUrl, path, size: file.size, mime: file.type }
}

/** Удаляет файл из Storage по пути. */
export async function removeFile(path: string): Promise<void> {
  const { error } = await adminClient().storage.from(STORAGE_BUCKET).remove([path])
  if (error) throw new DataError(`Не удалось удалить файл: ${error.message}`)
}
