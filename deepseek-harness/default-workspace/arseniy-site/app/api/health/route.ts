// Состояние данных сайта: откуда читается контент и настроена ли база.
// Полезно, когда непонятно, почему на сайте старые данные.
import { NextResponse } from 'next/server'
import { getPublicSite } from '@/lib/content-source'
import { isSupabaseConfigured, isSupabaseWritable } from '@/lib/supabase/config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const site = await getPublicSite()
    return NextResponse.json({
      ok: true,
      dataSource: site.source, // 'supabase' — данные из базы, 'file' — из data/content.json
      supabase: {
        configured: isSupabaseConfigured(),
        writable: isSupabaseWritable(),
      },
      counts: {
        projects: site.projects.length,
        timeline: site.timeline.length,
        skills: site.skills.length,
        books: site.books.length,
        social: site.social.length,
      },
      profile: { name: site.profile.name, city: site.profile.city, age: site.profile.age },
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Не удалось прочитать данные' },
      { status: 500 },
    )
  }
}
