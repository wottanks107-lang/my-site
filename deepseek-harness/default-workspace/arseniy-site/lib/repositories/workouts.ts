// Тренировки: записи, упражнения с подходами и весом, статистика.
import { adminClient } from '../supabase/client'
import { createRepo } from './crud'
import { many, nothing, one } from './errors'
import type { Workout, WorkoutExercise } from '../types'

const TABLE = 'workouts'
const repo = createRepo<Workout>(TABLE, {
  order: [{ column: 'workout_date', ascending: false }],
  publicColumn: null, // тренировки приватны
})

export const listWorkouts = repo.list
export const getWorkout = repo.get
export const createWorkout = repo.create
export const updateWorkout = repo.update
export const removeWorkout = repo.remove

export type WorkoutWithExercises = Workout & { workout_exercises: WorkoutExercise[] }

export async function listWorkoutsDetailed(): Promise<WorkoutWithExercises[]> {
  const rows = await many<WorkoutWithExercises>(
    TABLE,
    adminClient().from(TABLE).select('*, workout_exercises(*)').order('workout_date', { ascending: false }),
  )
  return rows.map(r => ({ ...r, workout_exercises: r.workout_exercises ?? [] }))
}

/** Быстрая отметка «был в зале» одной кнопкой. */
export function quickLog(kind: Workout['kind']): Promise<Workout> {
  return one<Workout>(TABLE, adminClient().from(TABLE).insert({ kind }).select().single())
}

// --- упражнения -------------------------------------------------------------

export const listExercises = (workoutId: string): Promise<WorkoutExercise[]> =>
  many<WorkoutExercise>('workout_exercises', adminClient().from('workout_exercises').select('*').eq('workout_id', workoutId).order('sort_order'))

export const addExercise = (
  workoutId: string,
  input: { name: string; sets?: number | null; reps?: number | null; weight_kg?: number | null },
): Promise<WorkoutExercise> =>
  one<WorkoutExercise>('workout_exercises', adminClient().from('workout_exercises').insert({ workout_id: workoutId, ...input }).select().single())

export const updateExercise = (id: string, patch: Partial<WorkoutExercise>): Promise<WorkoutExercise> =>
  one<WorkoutExercise>('workout_exercises', adminClient().from('workout_exercises').update(patch).eq('id', id).select().single())

export const removeExercise = (id: string): Promise<void> =>
  nothing('workout_exercises', adminClient().from('workout_exercises').delete().eq('id', id))

// --- статистика -------------------------------------------------------------

const dayOf = (value: string) => value.slice(0, 10)

export type WorkoutStats = {
  week: number
  month: number
  total: number
  streak: number
  byKind: { gym: number; swim: number; other: number }
}

/** Считает неделю, месяц, серию подряд и разбивку по типам. */
export function workoutStats(rows: Workout[], today = new Date()): WorkoutStats {
  const iso = (offsetDays: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() - offsetDays)
    return d.toISOString().slice(0, 10)
  }
  const dates = new Set(rows.map(r => dayOf(r.workout_date)))
  let streak = 0
  while (dates.has(iso(streak))) streak++

  return {
    week: rows.filter(r => dayOf(r.workout_date) >= iso(6)).length,
    month: rows.filter(r => dayOf(r.workout_date) >= iso(29)).length,
    total: rows.length,
    streak,
    byKind: {
      gym: rows.filter(r => r.kind === 'gym').length,
      swim: rows.filter(r => r.kind === 'swim').length,
      other: rows.filter(r => r.kind !== 'gym' && r.kind !== 'swim').length,
    },
  }
}

export async function getWorkoutStats(): Promise<WorkoutStats> {
  return workoutStats(await repo.list())
}
