'use client'
import { useActionState, useEffect, useState } from 'react'
import { Image as ImageIcon, Save } from 'lucide-react'
import { saveProfileAction } from '@/lib/actions/profile'
import { IDLE, splitList } from '@/lib/actions/types'
import { SelectField, TextAreaField, TextField } from '@/components/dashboard/Fields'
import PhotoField from '@/components/dashboard/PhotoField'
import { useToast } from '@/components/dashboard/Toast'
import type { Profile, SiteSettings } from '@/lib/types'

const POSITIONS = [
  { value: 'center', label: 'По центру' },
  { value: 'top', label: 'Сверху' },
  { value: 'bottom', label: 'Снизу' },
  { value: 'left', label: 'Слева' },
  { value: 'right', label: 'Справа' },
  { value: '50% 25%', label: 'Ближе к лицу (50% 25%)' },
]

type Preview = {
  name: string; age: string; city: string; tagline: string
  directions: string[]; primary: string; secondary: string
  photo: string; position: string
}

export default function ProfileForm({ profile, settings }: { profile: Profile | null; settings: SiteSettings | null }) {
  const [state, formAction, pending] = useActionState(saveProfileAction, IDLE)
  const toast = useToast()

  const [preview, setPreview] = useState<Preview>({
    name: profile?.name ?? 'Арсений',
    age: profile?.age ? String(profile.age) : '16',
    city: profile?.city ?? '',
    tagline: profile?.tagline ?? '',
    directions: profile?.directions ?? [],
    primary: profile?.primary_button_label ?? 'Мои проекты',
    secondary: profile?.secondary_button_label ?? 'Открыть Dashboard',
    photo: profile?.photo_url ?? '',
    position: profile?.photo_position ?? 'center',
  })

  // Ссылка на фото контролируемая: её меняет и загрузка файла, и ручной ввод.
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url ?? '')
  const [localPhoto, setLocalPhoto] = useState<string | null>(null)

  useEffect(() => {
    if (state.ok) toast('Профиль сохранён')
    else if (state.error) toast(state.error, 'error')
  }, [state, toast])

  // Живой предпросмотр: читаем текущие значения формы при любом изменении.
  const sync = (event: React.FormEvent<HTMLFormElement>) => {
    const data = new FormData(event.currentTarget)
    setPreview({
      name: String(data.get('name') ?? ''),
      age: String(data.get('age') ?? ''),
      city: String(data.get('city') ?? ''),
      tagline: String(data.get('tagline') ?? ''),
      directions: splitList(String(data.get('directions') ?? '')),
      primary: String(data.get('primary_button_label') ?? ''),
      secondary: String(data.get('secondary_button_label') ?? ''),
      photo: String(data.get('photo_url') ?? ''),
      position: String(data.get('photo_position') ?? 'center'),
    })
  }

  return (
    <div className="grid two" style={{ alignItems: 'start' }}>
      <form action={formAction} onChange={sync} className="panel form-grid">
        <h3 style={{ fontSize: 18 }}>Основное</h3>
        <div className="form-cols">
          <TextField name="name" label="Имя" defaultValue={profile?.name} required />
          <TextField name="age" label="Возраст" type="number" min={1} max={120} defaultValue={profile?.age ?? ''} />
        </div>
        <div className="form-cols">
          <TextField name="city" label="Город" defaultValue={profile?.city} placeholder="Севастополь" />
          <TextField name="email" label="Email" type="email" defaultValue={profile?.email} placeholder="you@mail.ru" />
        </div>

        <h3 style={{ fontSize: 18, marginTop: 10 }}>Тексты</h3>
        <TextField name="tagline" label="Короткая фраза под именем" defaultValue={profile?.tagline}
          placeholder="Учусь, создаю проекты и ищу своё направление." />
        <TextAreaField name="short_bio" label="Короткое описание" rows={2} defaultValue={profile?.short_bio} />
        <TextAreaField name="status" label="Чем занимаюсь сейчас" rows={2} defaultValue={profile?.status} />
        <TextAreaField name="bio_paragraphs" label="Абзацы «обо мне»" rows={6} defaultValue={profile?.bio_paragraphs?.join('\n\n')}
          hint="Каждый абзац отделяй пустой строкой" />
        <TextField name="directions" label="Направления" defaultValue={profile?.directions?.join(', ')}
          hint="Через запятую: AI, CODE, BUSINESS, SPORT" />

        <h3 style={{ fontSize: 18, marginTop: 10 }}>Кнопки на первом экране</h3>
        <div className="form-cols">
          <TextField name="primary_button_label" label="Первая кнопка" defaultValue={profile?.primary_button_label} />
          <TextField name="secondary_button_label" label="Вторая кнопка" defaultValue={profile?.secondary_button_label} />
        </div>

        <h3 style={{ fontSize: 18, marginTop: 10 }}>Фотография</h3>
        <PhotoField
          currentUrl={photoUrl || null}
          position={preview.position}
          onPreview={setLocalPhoto}
          onClearStored={() => {
            setPhotoUrl('')
            setPreview(current => ({ ...current, photo: '' }))
          }}
        />
        <label className="field">
          <span>Или ссылка на фото</span>
          <input
            type="text"
            name="photo_url"
            value={photoUrl}
            placeholder="/assets/avatar.jpg или https://…"
            onChange={event => {
              setPhotoUrl(event.target.value)
              setLocalPhoto(null)
              setPreview(current => ({ ...current, photo: event.target.value }))
            }}
          />
          <span className="hint">Загруженный файл важнее этой ссылки</span>
        </label>
        <SelectField name="photo_position" label="Кадрирование" defaultValue={profile?.photo_position} options={POSITIONS} />

        <div className="modal-foot" style={{ marginTop: 6 }}>
          <button className="btn fill" disabled={pending}>
            <Save size={15} aria-hidden /> {pending ? 'Сохраняю…' : 'Сохранить'}
          </button>
        </div>
      </form>

      <aside className="panel" style={{ position: 'sticky', top: 20 }}>
        <div className="panel-top">
          <span className="muted" style={{ fontSize: 12.5, letterSpacing: '.16em' }}>ПРЕДПРОСМОТР</span>
          <ImageIcon size={15} aria-hidden style={{ color: 'var(--red)' }} />
        </div>

        <h2 style={{ fontSize: 'clamp(28px,3.4vw,40px)', marginTop: 8 }}>
          {preview.name ? preview.name.toUpperCase() : 'ИМЯ'}
        </h2>
        <div style={{ fontWeight: 800, marginTop: 6 }}>{preview.age ? `${preview.age} лет.` : '—'}</div>
        {preview.tagline && <p style={{ marginTop: 14 }}>{preview.tagline}</p>}
        {preview.city && <span className="muted" style={{ fontSize: 13 }}>{preview.city}</span>}

        {preview.directions.length > 0 && (
          <div className="tag-row" style={{ marginTop: 18 }}>
            {preview.directions.map(direction => <span key={direction} className="tag">{direction}</span>)}
          </div>
        )}

        <div className="hero-actions" style={{ marginTop: 22 }}>
          <span className="btn fill sm">{preview.primary || 'Кнопка 1'}</span>
          <span className="btn ghost sm">{preview.secondary || 'Кнопка 2'}</span>
        </div>

        {(localPhoto || preview.photo) && (
          <div className="photo" style={{ marginTop: 22, aspectRatio: '4/3' }}>
            <img src={localPhoto ?? preview.photo} alt="" style={{ objectPosition: preview.position }} />
          </div>
        )}

        {settings && (
          <p className="muted" style={{ fontSize: 12.5, marginTop: 20, marginBottom: 0 }}>
            Заголовок сайта: {settings.site_title}
          </p>
        )}
      </aside>
    </div>
  )
}
