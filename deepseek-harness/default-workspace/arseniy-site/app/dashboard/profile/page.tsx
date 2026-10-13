import type { Metadata } from 'next'
import { getProfile, getSettings } from '@/lib/repositories'
import { firstError, safe } from '@/lib/safe'
import ProfileForm from './ProfileForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Профиль', robots: { index: false, follow: false } }

export default async function ProfilePage() {
  const [profile, settings] = await Promise.all([
    safe(() => getProfile(), null),
    safe(() => getSettings(), null),
  ])

  const error = firstError(profile, settings)

  return (
    <>
      <div className="dash-top">
        <div>
          <div className="eyebrow">Профиль</div>
          <h1 className="dash-title">Информация о себе</h1>
        </div>
      </div>

      {error && <div className="dash-error">Данные не загрузились: <code>{error}</code></div>}

      <ProfileForm profile={profile.data} settings={settings.data} />
    </>
  )
}
