// Таймлайн пути: «15 лет — первая работа», «2026 — поиск направления».
import { createRepo } from './crud'
import type { TimelineEvent } from '../types'

const repo = createRepo<TimelineEvent>('timeline_events', { order: [{ column: 'sort_order' }] })

export const listTimeline = repo.list
export const listPublicTimeline = repo.listPublic
export const getTimelineEvent = repo.get
export const createTimelineEvent = repo.create
export const updateTimelineEvent = repo.update
export const removeTimelineEvent = repo.remove
