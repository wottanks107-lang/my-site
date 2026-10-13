import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isAuthed } from '@/lib/auth'
import Sidebar from '@/components/dashboard/Sidebar'
import { ToastProvider } from '@/components/dashboard/Toast'

export const dynamic = 'force-dynamic'

// Приватный раздел: поисковикам индексировать нечего.
export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false, nocache: true },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthed())) redirect('/login')

  return (
    <ToastProvider>
      <div className="dash">
        <Sidebar />
        <div className="dash-main">{children}</div>
      </div>
    </ToastProvider>
  )
}
