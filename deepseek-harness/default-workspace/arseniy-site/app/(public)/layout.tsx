import { isAuthed } from '@/lib/auth'
import { getPublicSite } from '@/lib/content-source'
import Background from '@/components/Background'
import Cursor from '@/components/Cursor'
import PageFX from '@/components/PageFX'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const dynamic = 'force-dynamic'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // getPublicSite мемоизирован через cache(), поэтому страница не делает запрос повторно.
  const [site, admin] = await Promise.all([getPublicSite(), isAuthed()])

  return (
    <>
      <Background />
      <Cursor />
      <PageFX />
      <div className="shell">
        <SiteHeader admin={admin} name={site.profile.name} />
        <main>{children}</main>
        <SiteFooter name={site.profile.name} city={site.profile.city} social={site.social} />
      </div>
    </>
  )
}
