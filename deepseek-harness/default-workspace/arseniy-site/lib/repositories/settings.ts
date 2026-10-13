// Настройки сайта — одна строка с id = 1 (заголовок, описание, OG-картинка, акцент).
import { adminClient, readClient } from '../supabase/client'
import { maybeOne, one } from './errors'
import type { SiteSettings } from '../types'

const TABLE = 'site_settings'

export function getPublicSettings(): Promise<SiteSettings | null> {
  return maybeOne<SiteSettings>(TABLE, readClient().from(TABLE).select('*').eq('id', 1).limit(1))
}

export function getSettings(): Promise<SiteSettings | null> {
  return maybeOne<SiteSettings>(TABLE, adminClient().from(TABLE).select('*').eq('id', 1).limit(1))
}

export function updateSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  return one<SiteSettings>(TABLE, adminClient().from(TABLE).update(patch).eq('id', 1).select().single())
}

export function upsertSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  return one<SiteSettings>(TABLE, adminClient().from(TABLE).upsert({ id: 1, ...patch }).select().single())
}
