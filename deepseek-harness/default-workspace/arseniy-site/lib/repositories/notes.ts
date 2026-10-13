// Заметки: markdown-текст, категория, теги, закрепление.
import { adminClient } from '../supabase/client'
import { createRepo } from './crud'
import { many, nothing, one } from './errors'
import type { Note, NoteTag } from '../types'

const TABLE = 'notes'
const repo = createRepo<Note>(TABLE, {
  order: [{ column: 'pinned', ascending: false }, { column: 'note_date', ascending: false }],
})

export const listNotes = repo.list
export const getNote = repo.get
export const createNote = repo.create
export const updateNote = repo.update
export const removeNote = repo.remove
export const listPublicNotes = repo.listPublic

export type NoteWithTags = Note & { note_tags: NoteTag[] }

export async function listNotesDetailed(): Promise<NoteWithTags[]> {
  const rows = await many<NoteWithTags>(TABLE, adminClient().from(TABLE).select('*, note_tags(*)'))
  return rows.map(r => ({ ...r, note_tags: r.note_tags ?? [] }))
}

export const togglePin = (id: string, pinned: boolean): Promise<Note> =>
  one<Note>(TABLE, adminClient().from(TABLE).update({ pinned }).eq('id', id).select().single())

// --- теги -------------------------------------------------------------------

export const listTags = (noteId: string): Promise<NoteTag[]> =>
  many<NoteTag>('note_tags', adminClient().from('note_tags').select('*').eq('note_id', noteId))

export async function setTags(noteId: string, tags: string[]): Promise<void> {
  const clean = [...new Set(tags.map(t => t.trim().toLowerCase()).filter(Boolean))]
  const db = adminClient()
  await nothing('note_tags', db.from('note_tags').delete().eq('note_id', noteId))
  if (!clean.length) return
  await nothing('note_tags', db.from('note_tags').insert(clean.map(tag => ({ note_id: noteId, tag }))))
}

/** Все теги с количеством заметок — для фильтра. */
export async function listAllTags(): Promise<{ tag: string; count: number }[]> {
  const rows = await many<NoteTag>('note_tags', adminClient().from('note_tags').select('*'))
  const counter = new Map<string, number>()
  for (const row of rows) counter.set(row.tag, (counter.get(row.tag) ?? 0) + 1)
  return [...counter.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count)
}
