// Цели: прогресс, дедлайн, метрика «от → до» и подзадачи с чекбоксами.
import { adminClient } from '../supabase/client'
import { createRepo, replaceChildren } from './crud'
import { many, nothing, one } from './errors'
import type { Goal, GoalStatus, GoalTask } from '../types'

const TABLE = 'goals'
const repo = createRepo<Goal>(TABLE, { order: [{ column: 'sort_order' }] })

export const listGoals = repo.list
export const getGoal = repo.get
export const createGoal = repo.create
export const updateGoal = repo.update
export const removeGoal = repo.remove
export const listPublicGoals = repo.listPublic

export type GoalWithTasks = Goal & { goal_tasks: GoalTask[] }

export async function listGoalsDetailed(): Promise<GoalWithTasks[]> {
  const rows = await many<GoalWithTasks>(TABLE, adminClient().from(TABLE).select('*, goal_tasks(*)'))
  return rows.map(r => ({ ...r, goal_tasks: r.goal_tasks ?? [] }))
}

export async function setGoalStatus(id: string, status: GoalStatus): Promise<Goal> {
  return one<Goal>(TABLE, adminClient().from(TABLE).update({ status }).eq('id', id).select().single())
}

/**
 * Пересчитать прогресс цели по её подзадачам.
 * Если подзадач нет — прогресс не трогаем: его ставят вручную.
 */
export async function recomputeGoalProgress(goalId: string): Promise<Goal | null> {
  const tasks = await listGoalTasks(goalId)
  if (!tasks.length) return null
  const done = tasks.filter(t => t.done).length
  const progress = Math.round((done / tasks.length) * 100)
  return one<Goal>(TABLE, adminClient().from(TABLE).update({ progress }).eq('id', goalId).select().single())
}

// --- подзадачи --------------------------------------------------------------

export const listGoalTasks = (goalId: string): Promise<GoalTask[]> =>
  many<GoalTask>('goal_tasks', adminClient().from('goal_tasks').select('*').eq('goal_id', goalId).order('sort_order'))

export const addGoalTask = (goalId: string, title: string): Promise<GoalTask> =>
  one<GoalTask>('goal_tasks', adminClient().from('goal_tasks').insert({ goal_id: goalId, title }).select().single())

export const updateGoalTask = (id: string, patch: Partial<GoalTask>): Promise<GoalTask> =>
  one<GoalTask>('goal_tasks', adminClient().from('goal_tasks').update(patch).eq('id', id).select().single())

export const removeGoalTask = (id: string): Promise<void> =>
  nothing('goal_tasks', adminClient().from('goal_tasks').delete().eq('id', id))

export const replaceGoalTasks = (goalId: string, tasks: { title: string; done?: boolean }[]): Promise<void> =>
  replaceChildren('goal_tasks', 'goal_id', goalId, tasks.map(t => ({ title: t.title, done: t.done ?? false })))

/** Переключить подзадачу и сразу пересчитать прогресс цели. */
export async function toggleGoalTask(task: GoalTask): Promise<void> {
  await updateGoalTask(task.id, { done: !task.done })
  await recomputeGoalProgress(task.goal_id)
}
