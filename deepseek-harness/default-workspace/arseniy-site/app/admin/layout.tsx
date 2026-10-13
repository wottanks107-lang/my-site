import { readContent } from '@/lib/content'
import { isAuthed } from '@/lib/auth'
import { ContentProvider } from '@/lib/store'

export const dynamic = 'force-dynamic'

// Интерфейс админки работает на клиентском хранилище контента,
// поэтому провайдер подключается только в этом разделе.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [content, admin] = await Promise.all([readContent(), isAuthed()])
  return <ContentProvider initial={content} admin={admin}>{children}</ContentProvider>
}
