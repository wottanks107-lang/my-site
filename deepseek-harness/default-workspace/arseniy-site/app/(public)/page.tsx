import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { getPublicSite } from '@/lib/content-source'
import { PROJECT_STATUS_LABEL, type Project } from '@/lib/types'
import HeroOrb from '@/components/HeroOrb'

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="panel hoverable accent">
      <div className="panel-top">
        <span className="badge">{PROJECT_STATUS_LABEL[project.status]}</span>
        <span className="muted" style={{ fontSize: 13 }}>{project.period_label}</span>
      </div>
      <h3>{project.title}</h3>
      {project.summary && <p>{project.summary}</p>}
      <div className="panel-foot">
        <div className="progress"><i style={{ width: `${project.progress}%` }} /></div>
        <div className="progress-row">
          <span>Прогресс</span>
          <span>{project.progress}%</span>
        </div>
      </div>
    </Link>
  )
}

export default async function Home() {
  const { profile, projects, skills, books } = await getPublicSite()

  const featured = projects.slice(0, 3)
  const progress = [...skills].sort((a, b) => b.value - a.value).slice(0, 6)
  const photo = profile.photo_url || '/assets/placeholder.svg'

  return (
    <>
      <section className="hero">
        <HeroOrb />

        <div className="hero-copy">
          <div className="eyebrow rise">{profile.city ?? 'Севастополь'}</div>
          <h1 className="hero-name rise d1">{profile.name.toUpperCase()}</h1>
          <div className="hero-age rise d2">{profile.age} лет.</div>
          {profile.tagline && <p className="hero-tagline rise d3">{profile.tagline}</p>}

          <div className="tag-row rise d4">
            {profile.directions.map(direction => (
              <span key={direction} className="tag">{direction}</span>
            ))}
          </div>

          <div className="hero-actions rise d5">
            <Link className="btn fill" href="/projects">
              {profile.primary_button_label} <ArrowRight size={16} aria-hidden />
            </Link>
            <Link className="btn ghost" href="/admin">{profile.secondary_button_label}</Link>
          </div>
        </div>

        <div className="photo-wrap rise d3">
          <div className="photo">
            <img src={photo} alt={profile.name} style={{ objectPosition: profile.photo_position }} />
            <span className="photo-badge">
              <i className="dot-live pulse" aria-hidden />
              {[profile.city, '2026'].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>
      </section>

      <section id="now" className="section tight">
        <div className="section-head" data-reveal>
          <div>
            <div className="eyebrow">Сейчас</div>
            <h2>Чем я занят</h2>
          </div>
          <p className="lead" style={{ maxWidth: '42ch', marginBottom: 0 }}>{profile.status}</p>
        </div>

        <div className="grid" data-reveal>
          {[
            ['Проектов', projects.length],
            ['Направлений', profile.directions.length],
            ['Навыков в работе', skills.length],
            ['Книг на полке', books.length],
          ].map(([label, value]) => (
            <div key={String(label)} className="panel">
              <span className="muted" style={{ fontSize: 13 }}>{label}</span>
              <span className="kpi" style={{ marginTop: 10 }}>{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head" data-reveal>
          <div>
            <div className="eyebrow">Проекты</div>
            <h2>Что я создаю</h2>
          </div>
          <Link className="btn ghost sm" href="/projects">
            Все проекты <ArrowUpRight size={14} aria-hidden />
          </Link>
        </div>

        <div className="grid two" data-reveal>
          {featured.map(project => <ProjectCard key={project.id} project={project} />)}
        </div>
        {featured.length === 0 && <p className="empty">Проекты добавляются в панели.</p>}
      </section>

      <section className="section">
        <div className="section-head" data-reveal>
          <div>
            <div className="eyebrow">Прогресс</div>
            <h2>Где я сейчас</h2>
          </div>
          <p className="lead" style={{ maxWidth: '42ch', marginBottom: 0 }}>
            Стартовые значения, а не измерения. Меняются в панели.
          </p>
        </div>

        <div className="grid" data-reveal>
          {progress.map(skill => (
            <div key={skill.id} className="panel">
              <h3 style={{ fontSize: 18 }}>{skill.name}</h3>
              <div className="progress"><i style={{ width: `${Math.min(100, skill.value * 10)}%` }} /></div>
              <div className="progress-row">
                <span>{skill.level}</span>
                <span>{skill.value}/10</span>
              </div>
            </div>
          ))}
          {progress.length === 0 && <p className="empty">Навыки добавляются в панели.</p>}
        </div>
      </section>

      <section id="about" className="section">
        <div className="section-head" data-reveal>
          <div>
            <div className="eyebrow">Обо мне</div>
            <h2>Коротко</h2>
          </div>
        </div>
        <div className="grid two" data-reveal>
          <div className="panel">
            {profile.bio_paragraphs.slice(0, 2).map((paragraph, index) => (
              <p key={index} style={{ marginBottom: index === 0 ? '1em' : 0 }}>{paragraph}</p>
            ))}
            {profile.bio_paragraphs.length === 0 && <p style={{ marginBottom: 0 }}>{profile.short_bio}</p>}
          </div>
          <div className="panel">
            <div className="grid tight" style={{ gap: 18 }}>
              {[['Возраст', profile.age ? `${profile.age} лет` : '—'],
                ['Город', profile.city ?? '—'],
                ['Фокус', profile.directions.slice(0, 2).join(' · ') || '—']].map(([label, value]) => (
                <div key={String(label)}>
                  <div className="muted" style={{ fontSize: 13 }}>{label}</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contacts" className="section">
        <div className="section-head" data-reveal>
          <div>
            <div className="eyebrow">Контакты</div>
            <h2>Если хочешь связаться</h2>
          </div>
        </div>
        <div className="panel" data-reveal>
          <p className="lead" style={{ marginBottom: 22 }}>
            Пиши в любую из площадок ниже — отвечаю всем.
          </p>
          <div className="social-row">
            {profile.email && (
              <a className="social-link" href={`mailto:${profile.email}`}>{profile.email}</a>
            )}
            {profile.directions.length > 0 && (
              <Link className="btn fill sm" href="/projects">
                Смотреть проекты <ArrowRight size={14} aria-hidden />
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
