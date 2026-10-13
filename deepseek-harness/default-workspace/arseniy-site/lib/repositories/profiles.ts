// Профиль владельца — одна строка с id = 1.
import { adminClient, readClient } from '../supabase/client'
import { DataError, maybeOne, one } from './errors'
import type { Profile } from '../types'

const TABLE = 'profiles'

/** Профиль для публичного сайта — через anon-ключ и RLS. */
export function getPublicProfile(): Promise<Profile | null> {
  return maybeOne<Profile>(TABLE, readClient().from(TABLE).select('*').eq('id', 1).limit(1))
}

/** Профиль для dashboard и админки. */
export function getProfile(): Promise<Profile | null> {
  return maybeOne<Profile>(TABLE, adminClient().from(TABLE).select('*').eq('id', 1).limit(1))
}

/** Профиль с понятной ошибкой, если миграции ещё не выполнены. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) {
    throw new DataError(
      'profiles: строка профиля не найдена. Выполни миграции Supabase и запусти npm run migrate',
    )
  }
  return profile
}

export function updateProfile(patch: Partial<Profile>): Promise<Profile> {
  return one<Profile>(TABLE, adminClient().from(TABLE).update(patch).eq('id', 1).select().single())
}

export function upsertProfile(patch: Partial<Profile>): Promise<Profile> {
  return one<Profile>(
    TABLE,
    adminClient().from(TABLE).upsert({ id: 1, ...patch }).select().single(),
  )
}
