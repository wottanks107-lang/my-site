import type { Metadata } from 'next'
import { listEvents } from '@/lib/repositories'
import { firstError, safe } from '@/lib/safe'
import ScheduleManager from './ScheduleManager'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Расписание', robots: { index: false, follow: false } }

export default async function SchedulePage() {
  const events = await safe(() => listEvents(), [])

  return (
    <>
      <div className="dash-top">
        <div>
          <div className="eyebrow">Расписание</div>
          <h1 className="dash-title">Мой день и неделя</h1>
        </div>
      </div>

      {events.error && <div className="dash-error">Расписание не загрузилось: <code>{events.error}</code></div>}

      <ScheduleManager events={events.data} error={firstError(events)} />
    </>
  )
}
