import { z } from 'zod'
import type { CopyColumnTypeV2, CopyDefinitionV2, CopyPosition } from './copy.ts'
import { CANONICAL_CELL } from './copy.ts'
import type { ListPaging, ListRead } from './operation.ts'
import { listInputNames } from './operation.ts'
import type { Rows } from './rows.ts'

export type { ListPaging, ListRead }

/**
 * The input of one page: the definition's fixed input, then the paging (an offset's place and size, a
 * cursor's first-page input or the cursor itself) and, when the definition has `changedSince` and the pass
 * has a watermark, the changed-since input. The caller sends it through the operation's own schema.
 */
export function listInputOf(a: {
  list: ListRead
  definition: CopyDefinitionV2
  position: CopyPosition | null
  since: string | null
}): Record<string, unknown> {
  const { list, definition, position, since } = a
  const taken = listInputNames(list)
  for (const name of Object.keys(definition.source.input))
    if (taken.includes(name)) throw new Error(`A fixed input names ${name}, which the paging fills`)
  const { paging, changed } = list
  const place: Record<string, unknown> = {}
  if (paging.kind === 'OFFSET') {
    place[paging.offset] = position?.kind === 'OFFSET' ? position.offset : 0
    place[paging.limit] = paging.max
  } else if (paging.kind === 'CURSOR') {
    if (position?.kind === 'CURSOR') place[paging.cursor] = position.cursor
    else Object.assign(place, paging.start)
    place[paging.limit] = paging.max
  }
  if (changed !== null && definition.changedSince !== null && since !== null)
    place[changed.input] = since
  return { ...definition.source.input, ...place }
}

export type ListPage =
  | Readonly<{
      kind: 'PAGE'
      rows: readonly (readonly (string | null)[])[]
      more: boolean
      next: CopyPosition | null
      total: number | null
    }>
  | Readonly<{ kind: 'MISFIT'; column: string; path: string }>
  | Readonly<{ kind: 'UNREADABLE'; reason: 'NO_MORE_SIGNAL' | 'NO_CURSOR' }>
  | Readonly<{ kind: 'CEILING'; ceiling: number }>

/** The value at a dotted path of a row; a numeric segment indexes an array. */
export function valueAt(row: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (at, key) => (typeof at === 'object' && at !== null ? Reflect.get(at, key) : undefined),
      row,
    )
}

const Instant = z.iso.datetime({ offset: true })

type Cell = string | null | undefined // undefined: not a value of the type

function numberText(value: unknown, whole: boolean): Cell {
  if (typeof value === 'number')
    return (whole ? Number.isSafeInteger(value) : Number.isFinite(value))
      ? String(value)
      : undefined
  const pattern = CANONICAL_CELL[whole ? 'bigint' : 'numeric']
  return typeof value === 'string' && pattern.test(value) ? value : undefined
}

function dateText(value: unknown): Cell {
  if (typeof value !== 'string') return undefined
  if (CANONICAL_CELL.date.test(value)) return value
  return Instant.safeParse(value).success ? value.slice(0, 10) : undefined
}

function timestampText(value: unknown): Cell {
  return typeof value === 'string' && Instant.safeParse(value).success ? value : undefined
}

/** A JSON value as its type's canonical text; null and an absent path are null, a value the type cannot hold is undefined. */
function cellOf(type: CopyColumnTypeV2, value: unknown): Cell {
  if (value === null || value === undefined) return null
  switch (type) {
    case 'text':
      return typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : undefined
    case 'numeric':
      return numberText(value, false)
    case 'bigint':
      return numberText(value, true)
    case 'boolean':
      return typeof value === 'boolean' ? String(value) : undefined
    case 'date':
      return dateText(value)
    case 'timestamp':
      return timestampText(value)
    case 'json':
      return JSON.stringify(value)
    default:
      return type satisfies never
  }
}

type Rowed =
  | Readonly<{ kind: 'ROWS'; rows: (string | null)[][] }>
  | Extract<ListPage, { kind: 'MISFIT' }>

function cellsOf(definition: CopyDefinitionV2, rows: Rows): Rowed {
  const read: (string | null)[][] = []
  for (const row of rows.linhas) {
    const cells: (string | null)[] = []
    for (const { name, type, path } of definition.columns) {
      const cell = cellOf(type, valueAt(row, path))
      if (cell === undefined) return { kind: 'MISFIT', column: name, path }
      cells.push(cell)
    }
    read.push(cells)
  }
  return { kind: 'ROWS', rows: read }
}

/**
 * One answered page as the copy's rows: each cell the canonical text of its column's type, the next
 * position and whether more follows. A value that does not fit its type is `MISFIT`, never null; a page
 * with no sign of its end, or a cursor read with more to come and no cursor, is `UNREADABLE`; an offset
 * that would reach its declared ceiling with more pages ahead is `CEILING`.
 */
export function listPageOf(a: {
  list: ListRead
  definition: CopyDefinitionV2
  position: CopyPosition | null
  rows: Rows
  at: Date
}): ListPage {
  const { list, definition, position, rows, at } = a
  const read = cellsOf(definition, rows)
  if (read.kind === 'MISFIT') return read
  const total = rows.total ?? null
  const { paging } = list
  const more = rows.temMais
  if (more === null) return { kind: 'UNREADABLE', reason: 'NO_MORE_SIGNAL' }
  switch (paging.kind) {
    case 'NONE':
      if (more) return { kind: 'UNREADABLE', reason: 'NO_MORE_SIGNAL' }
      return { kind: 'PAGE', rows: read.rows, more, next: null, total }
    case 'OFFSET': {
      const offset = (position?.kind === 'OFFSET' ? position.offset : 0) + read.rows.length
      if (more && paging.ceiling !== null && offset >= paging.ceiling)
        return { kind: 'CEILING', ceiling: paging.ceiling }
      return {
        kind: 'PAGE',
        rows: read.rows,
        more,
        next: more ? { kind: 'OFFSET', offset } : null,
        total,
      }
    }
    case 'CURSOR': {
      if (!more) return { kind: 'PAGE', rows: read.rows, more, next: null, total }
      if (rows.seguinte === undefined) return { kind: 'UNREADABLE', reason: 'NO_CURSOR' }
      return {
        kind: 'PAGE',
        rows: read.rows,
        more,
        next: { kind: 'CURSOR', cursor: rows.seguinte, at: at.toISOString() },
        total,
      }
    }
    default:
      return paging satisfies never
  }
}
