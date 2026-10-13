import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getPublicSite } from '@/lib/content-source'
import { PROJECT_STATUS_LABEL } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Проекты',
  description: 'Проекты Арсения: AI-агенты, игры, эксперименты с продажами и личный сайт.',
}

export default async function ProjectsPage() {
  const { projects } = await getPublicSite()

  return (
    <div className="section">
      <div className="section-head">
        <div>
          <div className="eyebrow">Проекты</div>
          <h1 style={{ fontSize: 'clamp(38px,6vw,80px)' }}>То, что я создаю</h1>
        </div>
        <p className="lead" style={{ maxWidth: '40ch', marginBottom: 0 }}>
          Пока это только начало. Некоторые идеи существуют лишь на бумаге.
        </p>
      </div>

      {projects.length === 0 ? (
        <p className="empty">Проекты ещё не добавлены.</p>
      ) : (
        <div className="grid two" data-reveal>
          {projects.map(project => (
            <Link key={project.id} href={`/projects/${project.slug}`} className="panel hoverable accent">
              <div className="panel-top">
                <span className="badge">{PROJECT_STATUS_LABEL[project.status]}</span>
                <span className="muted" style={{ fontSize: 13 }}>{project.period_label}</span>
              </div>
              <h3>{project.title}</h3>
              {project.summary && <p>{project.summary}</p>}

              {project.tech.length > 0 && (
                <div className="tech-row">
                  {project.tech.map(tech => <span key={tech} className="tech">{tech}</span>)}
                </div>
              )}

              <div className="panel-foot">
                <div className="progress"><i style={{ width: `${project.progress}%` }} /></div>
                <div className="progress-row">
                  <span>Прогресс · {project.progress}%</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    Подробнее <ArrowUpRight size={13} aria-hidden />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
