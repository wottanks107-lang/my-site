import type { Metadata } from 'next'
import { listGoalsDetailed } from '@/lib/repositories'
import { firstError, safe } from '@/lib/safe'
import GoalsManager from './GoalsManager'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Цели', robots: { index: false, follow: false } }

export default async function GoalsPage() {
  const goals = await safe(() => listGoalsDetailed(), [])

  return (
    <>
      <div className="dash-top">
        <div>
          <div className="eyebrow">Цели</div>
          <h1 className="dash-title">Куда я иду</h1>
        </div>
      </div>

      {goals.error && <div className="dash-error">Цели не загрузились: <code>{goals.error}</code></div>}

      <GoalsManager goals={goals.data} error={firstError(goals)} />
    </>
  )
}
