import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({ subsets: ['latin', 'cyrillic'], weight: ['300', '500', '800'] })

export const metadata: Metadata = {
  title: {
    default: 'Arseniy — Personal OS',
    template: '%s · Arseniy',
  },
  description: 'Личный сайт Арсения: проекты, путь, цели и прогресс. AI, code, business, sport.',
  openGraph: {
    title: 'Arseniy — Personal OS',
    description: 'Личный сайт Арсения: проекты, путь, цели и прогресс.',
    type: 'website',
    locale: 'ru_RU',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = { themeColor: '#050505', viewportFit: 'cover' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={manrope.className}>{children}</body>
    </html>
  )
}
