// Проекты: карточки, страницы проектов, задачи, скриншоты, changelog.
import { adminClient, readClient } from '../supabase/client'
import { createRepo, replaceChildren } from './crud'
import { DataError, many, maybeOne, nothing, one } from './errors'
import type { Project, ProjectChangelog, ProjectMedia, ProjectTask } from '../types'

const TABLE = 'projects'
const repo = createRepo<Project>(TABLE, { order: [{ column: 'sort_order' }] })

export const listProjects = repo.list
export const listPublicProjects = repo.listPublic
export const getProject = repo.get
export const createProject = repo.create
export const updateProject = repo.update
export const removeProject = repo.remove

/** Проект по адресу страницы. */
export const getProjectBySlug = (slug: string): Promise<Project | null> =>
  maybeOne<Project>(TABLE, adminClient().from(TABLE).select('*').eq('slug', slug).limit(1))

export const getPublicProjectBySlug = (slug: string): Promise<Project | null> =>
  maybeOne<Project>(TABLE, readClient().from(TABLE).select('*').eq('slug', slug).eq('is_public', true).limit(1))

export type ProjectDetail = {
  project: Project
  tasks: ProjectTask[]
  media: ProjectMedia[]
  changelog: ProjectChangelog[]
}

async function detail(project: Project | null): Promise<ProjectDetail> {
  if (!project) throw new DataError('projects: проект не найден')
  const db = adminClient()
  const [tasks, media, changelog] = await Promise.all([
    many<ProjectTask>('project_tasks', db.from('project_tasks').select('*').eq('project_id', project.id).order('sort_order')),
    many<ProjectMedia>('project_media', db.from('project_media').select('*').eq('project_id', project.id).order('sort_order')),
    many<ProjectChangelog>('project_changelog', db.from('project_changelog').select('*').eq('project_id', project.id).order('happened_on', { ascending: false })),
  ])
  return { project, tasks, media, changelog }
}

export async function getProjectDetail(id: string): Promise<ProjectDetail> {
  return detail(await getProject(id))
}

export async function getPublicProjectDetail(slug: string): Promise<ProjectDetail> {
  return detail(await getPublicProjectBySlug(slug))
}

// --- задачи проекта ---------------------------------------------------------

export const listProjectTasks = (projectId: string): Promise<ProjectTask[]> =>
  many<ProjectTask>('project_tasks', adminClient().from('project_tasks').select('*').eq('project_id', projectId).order('sort_order'))

export const createProjectTask = (projectId: string, title: string): Promise<ProjectTask> =>
  one<ProjectTask>('project_tasks', adminClient().from('project_tasks').insert({ project_id: projectId, title }).select().single())

export const updateProjectTask = (id: string, patch: Partial<ProjectTask>): Promise<ProjectTask> =>
  one<ProjectTask>('project_tasks', adminClient().from('project_tasks').update(patch).eq('id', id).select().single())

export const removeProjectTask = (id: string): Promise<void> =>
  nothing('project_tasks', adminClient().from('project_tasks').delete().eq('id', id))

export const replaceProjectTasks = (projectId: string, tasks: { title: string; done?: boolean }[]): Promise<void> =>
  replaceChildren('project_tasks', 'project_id', projectId, tasks.map(t => ({ title: t.title, done: t.done ?? false })))

// --- скриншоты --------------------------------------------------------------

export const listProjectMedia = (projectId: string): Promise<ProjectMedia[]> =>
  many<ProjectMedia>('project_media', adminClient().from('project_media').select('*').eq('project_id', projectId).order('sort_order'))

export const addProjectMedia = (projectId: string, url: string, caption?: string): Promise<ProjectMedia> =>
  one<ProjectMedia>('project_media', adminClient().from('project_media').insert({ project_id: projectId, url, caption: caption ?? null }).select().single())

export const removeProjectMedia = (id: string): Promise<void> =>
  nothing('project_media', adminClient().from('project_media').delete().eq('id', id))

// --- changelog --------------------------------------------------------------

export const listProjectChangelog = (projectId: string): Promise<ProjectChangelog[]> =>
  many<ProjectChangelog>('project_changelog', adminClient().from('project_changelog').select('*').eq('project_id', projectId).order('happened_on', { ascending: false }))

export const addProjectLogEntry = (projectId: string, body: string, happenedOn?: string): Promise<ProjectChangelog> =>
  one<ProjectChangelog>('project_changelog', adminClient().from('project_changelog').insert({
    project_id: projectId,
    body,
    ...(happenedOn ? { happened_on: happenedOn } : {}),
  }).select().single())

export const removeProjectLogEntry = (id: string): Promise<void> =>
  nothing('project_changelog', adminClient().from('project_changelog').delete().eq('id', id))
