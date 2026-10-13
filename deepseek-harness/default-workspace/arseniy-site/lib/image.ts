'use client'
// Подготовка картинки в браузере: уменьшаем большие фото и сжимаем,
// чтобы в Storage не улетали файлы по 8 МБ прямо с телефона.

const MAX_SIDE = 1920
const QUALITY = 0.86

/**
 * Уменьшает изображение до MAX_SIDE по большей стороне и пережимает в WebP.
 * Если что-то не получилось или стало только хуже — возвращает исходный файл.
 */
export async function compressImage(file: File, maxSide = MAX_SIDE, quality = QUALITY): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.type === 'image/gif') return file // анимацию не трогаем

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) { bitmap.close(); return file }
    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', quality))
    if (!blob || blob.size >= file.size) return file

    const name = file.name.replace(/\.[^.]+$/, '') + '.webp'
    return new File([blob], name, { type: 'image/webp' })
  } catch {
    return file
  }
}

export const humanSize = (bytes: number): string =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(bytes / 1024))} КБ`
