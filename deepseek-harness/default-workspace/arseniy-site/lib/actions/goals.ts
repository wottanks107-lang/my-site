'use server'
// Серверные экшены целей: сохранение, удаление, подзадачи.
import { revalidatePath } from 'next/cache'
import { isAuthed } from '../auth'
import {
  addGoalTask, createGoal, recomputeGoalProgress, removeGoal,
  removeGoalTask, updateGoal, updateGoalTask,
} from '../repositories/goals'
import type { GoalStatus, PriorityLevel } from '../types'
import { ActionState, DENIED, boundedInt, checked, message, nullable, str } from './types'

const GOAL_STATUSES: GoalStatus[] = ['not_started', 'in_progress', 'done', 'paused']
const PRIORITIES: PriorityLevel[] = ['low', 'normal', 'high']

const refresh = () => {
  revalidatePath('/dashboard/goals')
  revalidatePath('/dashboard')
}

export async function saveGoalAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isAuthed())) return DENIED

  const title = str(formData, 'title')
  if (!title) return { ok: false, error: 'Название цели обязательно' }

  const status = str(formData, 'status') as GoalStatus
  const priority = str(formData, 'priority') as PriorityLevel

  const payload = {
    title,
    category: nullable(formData, 'category'),
    description: nullable(formData, 'description'),
    deadline: nullable(formData, 'deadline'),
    progress: boundedInt(formData, 'progress', 0, 100),
    status: GOAL_STATUSES.includes(status) ? status : 'not_started',
    priority: PRIORITIES.includes(priority) ? priority : 'normal',
    metric_from: nullable(formData, 'metric_from'),
    metric_to: nullable(formData, 'metric_to'),
    is_public: checked(formData, 'is_public'),
  }

  try {
    const id = str(formData, 'id')
    if (id) await updateGoal(id, payload)
    else await createGoal(payload)
    refresh()
    return { ok: true, error: null }
  } catch (error) {
    return { ok: false, error: message(error, 'Не удалось сохранить цель') }
  }
}

export async function deleteGoalAction(formData: FormData): Promise<ActionState> {
  if (!(await isAuthed())) return DENIED
  try {
    await removeGoal(str(formData, 'id'))
    refresh()
    return { ok: true, error: null }
  } catch (error) {
    return { ok: false, error: message(error, 'Не удалось удалить цель') }
  }
}

export async function addGoalTaskAction(formData: FormData): Promise<ActionState> {
  if (!(await isAuthed())) return DENIED
  const title = str(formData, 'title')
  const goalId = str(formData, 'goal_id')
  if (!title) return { ok: false, error: 'Название подзадачи обязательно' }

  try {
    await addGoalTask(goalId, title)
    await recomputeGoalProgress(goalId)
    refresh()
    return { ok: true, error: null }
  } catch (error) {
    return { ok: false, error: message(error, 'Не удалось добавить подзадачу') }
  }
}

export async function toggleGoalTaskAction(formData: FormData): Promise<ActionState> {
  if (!(await isAuthed())) return DENIED
  const id = str(formData, 'id')
  const goalId = str(formData, 'goal_id')

  try {
    await updateGoalTask(id, { done: checked(formData, 'done') })
    // Прогресс цели пересчитывается по подзадачам.
    await recomputeGoalProgress(goalId)
    refresh()
    return { ok: true, error: null }
  } catch (error) {
    return { ok: false, error: message(error, 'Не удалось изменить подзадачу') }
  }
}

export async function deleteGoalTaskAction(formData: FormData): Promise<ActionState> {
  if (!(await isAuthed())) return DENIED
  try {
    await removeGoalTask(str(formData, 'id'))
    refresh()
    return { ok: true, error: null }
  } catch (error) {
    return { ok: false, error: message(error, 'Не удалось удалить подзадачу') }
  }
}
