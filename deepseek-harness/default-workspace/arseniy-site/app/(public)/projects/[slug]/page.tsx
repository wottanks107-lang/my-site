import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, GitBranch } from 'lucide-react'
import { getPublicSite } from '@/lib/content-source'
import { PROJECT_STATUS_LABEL } from '@/lib/types'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { projects } = await getPublicSite()
  const project = projects.find(item => item.slug === slug)
  if (!project) return { title: 'Проект не найден' }
  return {
    title: project.title,
    description: project.summary ?? project.description ?? undefined,
  }
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const { projects } = await getPublicSite()
  const project = projects.find(item => item.slug === slug)
  if (!project) notFound()

  return (
    <article className="section">
      <Link href="/projects" className="btn ghost sm" style={{ marginBottom: 28 }}>
        <ArrowLeft size={14} aria-hidden /> Все проекты
      </Link>

      <div className="section-head">
        <div>
          <div className="eyebrow">{project.period_label ?? 'Проект'}</div>
          <h1 style={{ fontSize: 'clamp(36px,5.6vw,76px)' }}>{project.title}</h1>
        </div>
        <span className="badge">{PROJECT_STATUS_LABEL[project.status]}</span>
      </div>

      {project.description && <p className="lead" style={{ maxWidth: '70ch' }}>{project.description}</p>}

      <div className="grid two" style={{ marginTop: 40 }}>
        <div className="panel">
          <h3 style={{ fontSize: 18 }}>Прогресс</h3>
          <div className="progress"><i style={{ width: `${project.progress}%` }} /></div>
          <div className="progress-row">
            <span>{PROJECT_STATUS_LABEL[project.status]}</span>
            <span>{project.progress}%</span>
          </div>
        </div>

        {project.tech.length > 0 && (
          <div className="panel">
            <h3 style={{ fontSize: 18, marginBottom: 14 }}>Технологии</h3>
            <div className="tech-row" style={{ marginTop: 0 }}>
              {project.tech.map(tech => <span key={tech} className="tech">{tech}</span>)}
            </div>
          </div>
        )}
      </div>

      {(project.github_url || project.demo_url) && (
        <div className="row" style={{ marginTop: 28 }}>
          {project.github_url && (
            <a className="btn ghost sm" href={project.github_url} target="_blank" rel="noreferrer noopener">
              <GitBranch size={15} aria-hidden /> Код на GitHub
            </a>
          )}
          {project.demo_url && (
            <a className="btn fill sm" href={project.demo_url} target="_blank" rel="noreferrer noopener">
              <ExternalLink size={15} aria-hidden /> Открыть демо
            </a>
          )}
        </div>
      )}
    </article>
  )
}
