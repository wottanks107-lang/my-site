'use client'
// Выбор фотографии: файл сжимается в браузере, показывается предпросмотр,
// а сама загрузка происходит при сохранении формы.
import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash } from 'lucide-react'
import { compressImage, humanSize } from '@/lib/image'

const MAX_SOURCE_BYTES = 20 * 1024 * 1024

export default function PhotoField({
  currentUrl, position, onPreview, onClearStored,
}: {
  currentUrl: string | null
  position: string
  onPreview: (objectUrl: string | null) => void
  onClearStored: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localUrl, setLocalUrl] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  // Освобождаем память браузера за ненужным больше предпросмотром.
  useEffect(() => () => { if (localUrl) URL.revokeObjectURL(localUrl) }, [localUrl])

  const choose = async (file: File | undefined) => {
    setNote('')
    setError('')
    if (!file) return

    if (!file.type.startsWith('image/')) { setError('Это не изображение'); return }
    if (file.size > MAX_SOURCE_BYTES) { setError(`Файл больше ${humanSize(MAX_SOURCE_BYTES)}`); return }

    try {
      const prepared = await compressImage(file)

      // Подменяем файл в поле формы на сжатый вариант.
      const transfer = new DataTransfer()
      transfer.items.add(prepared)
      if (inputRef.current) inputRef.current.files = transfer.files

      if (localUrl) URL.revokeObjectURL(localUrl)
      const url = URL.createObjectURL(prepared)
      setLocalUrl(url)
      onPreview(url)

      setNote(prepared.size < file.size
        ? `Готово к загрузке: ${humanSize(prepared.size)} (было ${humanSize(file.size)})`
        : `Готово к загрузке: ${humanSize(prepared.size)}`)
    } catch {
      setError('Не удалось обработать изображение')
    }
  }

  const clear = () => {
    if (inputRef.current) inputRef.current.value = ''
    if (localUrl) URL.revokeObjectURL(localUrl)
    setLocalUrl(null)
    setNote('')
    onPreview(null)
    onClearStored()
  }

  const shown = localUrl ?? currentUrl
  const hasPhoto = Boolean(shown)

  return (
    <div className="photo-field">
      <div className="photo" style={{ aspectRatio: '4/5', maxWidth: 210 }}>
        <img
          src={shown || '/assets/placeholder.svg'}
          alt="Фотография на главном экране"
          style={{ objectPosition: position }}
        />
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <button type="button" className="btn sm" onClick={() => inputRef.current?.click()}>
          <ImagePlus size={15} aria-hidden /> {hasPhoto ? 'Заменить фото' : 'Загрузить фото'}
        </button>
        {hasPhoto && (
          <button type="button" className="btn ghost sm" onClick={clear}>
            <Trash size={15} aria-hidden /> Удалить
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        name="photo_file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        hidden
        onChange={event => choose(event.target.files?.[0])}
      />

      <span className="hint">
        {note || 'JPEG, PNG, WebP, GIF или AVIF. Большие фото сжимаются автоматически.'}
      </span>
      {error && <span className="hint" style={{ color: 'var(--red)' }}>{error}</span>}
      {localUrl && <span className="hint">Новое фото применится после нажатия «Сохранить».</span>}
    </div>
  )
}
