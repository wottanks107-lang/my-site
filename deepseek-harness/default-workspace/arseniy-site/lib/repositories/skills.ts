// Навыки и прогресс (0–10).
import { createRepo } from './crud'
import type { Skill } from '../types'

const repo = createRepo<Skill>('skills', { order: [{ column: 'sort_order' }] })

export const listSkills = repo.list
export const listPublicSkills = repo.listPublic
export const getSkill = repo.get
export const createSkill = repo.create
export const updateSkill = repo.update
export const removeSkill = repo.remove
