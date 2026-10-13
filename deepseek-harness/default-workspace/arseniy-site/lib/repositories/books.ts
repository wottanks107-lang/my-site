// Книги: полка, прогресс чтения, рейтинг, даты.
import { createRepo } from './crud'
import type { Book } from '../types'

const repo = createRepo<Book>('books', { order: [{ column: 'sort_order' }] })

export const listBooks = repo.list
export const listPublicBooks = repo.listPublic
export const getBook = repo.get
export const createBook = repo.create
export const updateBook = repo.update
export const removeBook = repo.remove

/** Книги, сгруппированные по статусу — для страницы «Читаю». */
export async function listBooksByStatus() {
  const books = await repo.list()
  return {
    reading: books.filter(b => b.status === 'reading'),
    want: books.filter(b => b.status === 'want'),
    done: books.filter(b => b.status === 'done'),
    dropped: books.filter(b => b.status === 'dropped'),
  }
}
