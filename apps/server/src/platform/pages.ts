import type { Next } from '@conexus/hub-api'
import { PAGE_SIZE } from '@conexus/hub-api'
import type { SQL, SQLWrapper } from 'drizzle-orm'
import { gt } from 'drizzle-orm'
import type { z } from 'zod'
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

/**
 * The id of the row a page token starts after, parsed by the contract's schema of the list's ids;
 * a token not in `pageOf`'s form, or whose id that schema refuses, is malformed.
 */
export function pageKey<Id extends z.ZodType<string, string>>(
  page: string | undefined,
  id: Id,
): z.output<Id> | undefined {
  if (page === undefined) return undefined
  const read = Buffer.from(page, 'base64url').toString('utf8')
  const parsed = id.safeParse(read)
  if (!parsed.success || Buffer.from(read).toString('base64url') !== page) {
    throw new Failure('REQUEST_MALFORMED', { details: { reason: 'PAGE' }, cause: parsed.error })
  }
  return parsed.data
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
