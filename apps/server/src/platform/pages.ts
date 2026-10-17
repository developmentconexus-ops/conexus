import type { Next } from '@conexus/hub-api'
import { LIBRARY_ID, PAGE_SIZE } from '@conexus/hub-api'
import type { SQL, SQLWrapper } from 'drizzle-orm'
import { gt } from 'drizzle-orm'
import { Failure } from './failure.ts'

/**
 * One row more than a page tells whether another page follows. Its token is the last row's id in
 * base64url, which the client sends back and never reads (code C44).
 */
export function pageOf<T>(rows: T[], idOf: (row: T) => string): { rows: T[]; next: Next } {
  const shown = rows.slice(0, PAGE_SIZE)
  const last = shown.at(-1)
  if (rows.length <= PAGE_SIZE || last === undefined) return { rows: shown, next: { kind: 'END' } }
  return {
    rows: shown,
    next: { kind: 'MORE', page: Buffer.from(idOf(last)).toString('base64url') },
  }
}

/** The id of the row a page token starts after; a token not in `pageOf`'s form is malformed. */
export function pageKey(page: string | undefined): string | undefined {
  if (page === undefined) return undefined
  const id = Buffer.from(page, 'base64url').toString('utf8')
  if (!LIBRARY_ID.test(id) || Buffer.from(id).toString('base64url') !== page) {
    throw new Failure('REQUEST_MALFORMED', { details: { reason: 'PAGE' } })
  }
  return id
}

/**
 * Rows ordered after the one `id` names, whose order key `anchor` selects; every row on no id. The
 * caller's `(a, b)` is SQL because the builder has no row value (boundaries).
 */
export function after(
  order: SQL,
  id: string | undefined,
  anchor: (id: string) => SQLWrapper,
): SQL | undefined {
  return id === undefined ? undefined : gt(order, anchor(id))
}
