'use server'
// Серверные экшены профиля и настроек сайта.
// Каждый экшен проверяет вход: экшены доступны по POST из браузера.
import { revalidatePath } from 'next/cache'
import { isAuthed } from '../auth'
import { updateProfile } from '../repositories/profiles'
import { upsertSettings } from '../repositories/settings'
import { isUploadedFile, uploadImage } from '../services/storage'
import { ActionState, DENIED, boundedInt, message, nullable, splitList, str } from './types'

/** Абзацы раздела «обо мне» разделяются пустой строкой. */
const toParagraphs = (value: string): string[] =>
  value.split(/\n\s*\n/).map(chunk => chunk.trim()).filter(Boolean)

export async function saveProfileAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isAuthed())) return DENIED

  const name = str(formData, 'name')
  if (!name) return { ok: false, error: 'Имя не может быть пустым' }

  const ageRaw = str(formData, 'age')

  try {
    // Загруженный файл важнее ссылки в текстовом поле.
    let photoUrl = nullable(formData, 'photo_url')
    const photoFile = formData.get('photo_file')
    if (isUploadedFile(photoFile)) {
      photoUrl = (await uploadImage(photoFile, 'profile')).url
    }

    await updateProfile({
      name,
      age: ageRaw === '' ? null : boundedInt(formData, 'age', 1, 120, 16),
      city: nullable(formData, 'city'),
      tagline: nullable(formData, 'tagline'),
      short_bio: nullable(formData, 'short_bio'),
      bio_paragraphs: toParagraphs(str(formData, 'bio_paragraphs')),
      status: nullable(formData, 'status'),
      directions: splitList(str(formData, 'directions')),
      email: nullable(formData, 'email'),
      photo_url: photoUrl,
      photo_position: str(formData, 'photo_position') || 'center',
      primary_button_label: str(formData, 'primary_button_label') || 'Мои проекты',
      secondary_button_label: str(formData, 'secondary_button_label') || 'Открыть Dashboard',
    })

    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard')
    revalidatePath('/')
    return { ok: true, error: null }
  } catch (error) {
    return { ok: false, error: message(error, 'Не удалось сохранить профиль') }
  }
}

export async function saveSettingsAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isAuthed())) return DENIED

  const accent = str(formData, 'accent_color')
  if (accent && !/^#[0-9a-fA-F]{6}$/.test(accent)) {
    return { ok: false, error: 'Акцентный цвет должен быть в формате #RRGGBB' }
  }

  try {
    await upsertSettings({
      site_title: str(formData, 'site_title') || 'Arseniy — Personal OS',
      site_description: str(formData, 'site_description'),
      og_image_url: nullable(formData, 'og_image_url'),
      accent_color: accent || '#E5202E',
    })

    revalidatePath('/dashboard/settings')
    revalidatePath('/')
    return { ok: true, error: null }
  } catch (error) {
    return { ok: false, error: message(error, 'Не удалось сохранить настройки') }
  }
}
