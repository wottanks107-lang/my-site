import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAuthed } from '@/lib/auth'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function Admin() {
  if (!(await isAuthed())) redirect('/login')
  return (
    <>
      <div className="adm" style={{ paddingBottom: 0 }}>
        <div className="notice">
          <b>Эта панель устарела.</b> Сайт теперь читает данные из Supabase, а правки здесь
          сохраняются в файл <code>data/content.json</code> и на сайте не появляются.
          Рабочий интерфейс — <Link className="red" href="/dashboard">dashboard</Link>.
        </div>
      </div>
      <AdminClient />
    </>
  )
}
