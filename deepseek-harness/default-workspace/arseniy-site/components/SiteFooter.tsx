import { GitBranch, Link as LinkIcon, Mail, Play, Send } from 'lucide-react'
import type { SocialLink } from '@/lib/types'

// Иконки lucide для известных площадок. Незнакомые получают нейтральную ссылку.
// Логотипы брендов из lucide убрали, поэтому используем нейтральные иконки.
const ICONS: Record<string, typeof Send> = {
  telegram: Send,
  tg: Send,
  youtube: Play,
  github: GitBranch,
  mail: Mail,
  email: Mail,
}

function iconFor(link: SocialLink) {
  const byIcon = link.icon ? ICONS[link.icon.toLowerCase()] : undefined
  if (byIcon) return byIcon
  return ICONS[link.label.toLowerCase()] ?? LinkIcon
}

export default function SiteFooter({
  name, city, social,
}: {
  name: string
  city: string | null
  social: SocialLink[]
}) {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="inner">
        <div>
          <div style={{ color: 'var(--tx)', fontWeight: 800, letterSpacing: '.16em' }}>
            {name.toUpperCase()}
          </div>
          <div>{[city, `${year}`].filter(Boolean).join(' · ')}</div>
          <div style={{ marginTop: 6 }}>
            <a href="/admin" className="x">панель</a>
          </div>
        </div>

        <div className="social-row">
          {social.length === 0 && <span>Ссылки добавляются в панели</span>}
          {social.map(link => {
            const Icon = iconFor(link)
            return (
              <a
                key={link.id}
                className="social-link"
                href={link.url}
                target={link.url.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer noopener"
              >
                <Icon size={15} aria-hidden />
                {link.label}
              </a>
            )
          })}
        </div>
      </div>
    </footer>
  )
}
