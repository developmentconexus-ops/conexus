import { z } from 'zod'
import type { Operation } from './operation.ts'
import { Instant, valueAt } from './operation.ts'
import type { Rows } from './rows.ts'
import { Rows as RowsSchema } from './rows.ts'
import type { TableColumnType, TablePosition, TableReadFailed, TableSource } from './tables.ts'
import type { PageAsk, TablePageRead } from './tables-call.ts'
import { called, pageOf, rowsAfter, UNREADABLE } from './tables-call.ts'

type Cell = string | null | undefined // undefined: not a value of the type

const DECIMAL = /^-?\d+(\.\d+)?$/
const WHOLE = /^-?\d+$/
const DAY = z.iso.date()
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/

function numberText(value: unknown, whole: boolean): Cell {
  if (typeof value === 'number') {
    const text = String(value)
    const fits = whole ? Number.isSafeInteger(value) : Number.isFinite(value)
    return fits && !text.includes('e') ? text : undefined
  }
  return typeof value === 'string' && (whole ? WHOLE : DECIMAL).test(value) ? value : undefined
}

function dayText(value: unknown): Cell {
  if (typeof value !== 'string') return undefined
  if (DAY.safeParse(value).success) return value
  return Instant.safeParse(value).success ? value.slice(0, 10) : undefined
}

/** A JSON value of an operation's row as its type's canonical text; null and an absent path are null. */
function cellOf(type: TableColumnType, value: unknown): Cell {
  if (value === null || value === undefined) return null
  switch (type) {
    case 'text':
      return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : undefined
    case 'numeric':
      return numberText(value, false)
    case 'bigint':
      return numberText(value, true)
    case 'boolean':
      return typeof value === 'boolean' ? String(value) : undefined
    case 'date':
      return dayText(value)
    case 'timestamp':
      return typeof value === 'string' && Instant.safeParse(value).success ? value : undefined
    case 'json':
      return JSON.stringify(value)
    case 'binary':
      return typeof value === 'string' && BASE64.test(value) ? value : undefined
    default:
      return type satisfies never
  }
}

/** The input of an operation's page: the declaration's fixed input, the paging's place and size, and the change filter. */
function operationInputOf(
  ask: PageAsk,
  source: Extract<TableSource, { kind: 'OPERATION' }>,
  operation: Operation<unknown, unknown>,
  limit: number,
): Record<string, unknown> {
  const list = operation.list
  if (list === undefined) throw new Error(`${operation.id} declares no list`)
  const { paging, changed } = list
  const { after, filter } = ask
  const place: Record<string, unknown> = {}
  if (paging.kind === 'OFFSET') {
    place[paging.offset] = after?.kind === 'OFFSET' ? after.offset : 0
    place[paging.limit] = Math.min(limit, paging.max)
  } else if (paging.kind === 'CURSOR') {
    if (after?.kind === 'CURSOR') place[paging.cursor] = after.cursor
    else Object.assign(place, paging.start)
    place[paging.limit] = Math.min(limit, paging.max)
  }
  if (filter.kind === 'SINCE' && changed !== null) place[changed.input] = filter.after
  return { ...source.input, ...place }
}

type Next = Readonly<{ kind: 'NEXT'; place: TablePosition | null }> | TableReadFailed

/** Where the walk goes after a page by the paging's own rule: an empty offset page ends it, as in Airbyte's `OffsetIncrement`. */
function nextOf(
  operation: Operation<unknown, unknown>,
  ask: PageAsk,
  rows: Rows,
  rowsNext: number,
): Next {
  const paging = operation.list?.paging
  const more = rows.temMais
  if (paging === undefined || more === null) return UNREADABLE
  if (!more) return { kind: 'NEXT', place: null }
  switch (paging.kind) {
    case 'NONE':
      return UNREADABLE
    case 'OFFSET': {
      if (rows.linhas.length === 0) return { kind: 'NEXT', place: null }
      const offset = (ask.after?.kind === 'OFFSET' ? ask.after.offset : 0) + rows.linhas.length
      if (paging.ceiling !== null && offset >= paging.ceiling) return UNREADABLE
      return { kind: 'NEXT', place: { kind: 'OFFSET', offset, rows: rowsNext } }
    }
    case 'CURSOR':
      return rows.seguinte === undefined
        ? UNREADABLE
        : {
            kind: 'NEXT',
            place: {
              kind: 'CURSOR',
              cursor: rows.seguinte,
              at: new Date().toISOString(),
              rows: rowsNext,
            },
          }
    default:
      return paging satisfies never
  }
}

export async function operationPage(
  ask: PageAsk,
  source: Extract<TableSource, { kind: 'OPERATION' }>,
): Promise<TablePageRead> {
  const { connector } = ask
  const operation = [...connector.operations, ...Object.values(connector.readDoor ?? {})].find(
    (each) => each.id === source.operation,
  )
  if (operation === undefined) throw new Error(`${source.operation} is no read of ${connector.id}`)
  const page = pageOf(connector)
  const limit = ask.after?.rows ?? page.rows
  const read = await called(ask, operation, operationInputOf(ask, source, operation, limit))
  if (read.kind !== 'READ') return read
  const answered = RowsSchema.safeParse(read.value)
  if (!answered.success) return UNREADABLE
  const columns = ask.table.columns.kind === 'DECLARED' ? ask.table.columns.columns : ([] as const)
  const rows: Record<string, string | null>[] = []
  for (const row of answered.data.linhas) {
    const cells: [string, string | null][] = []
    for (const { name, type, path } of columns) {
      const cell = cellOf(type, valueAt(row, path))
      if (cell === undefined) return UNREADABLE
      cells.push([name, cell])
    }
    rows.push(Object.fromEntries(cells))
  }
  const next = nextOf(operation, ask, answered.data, rowsAfter(limit, rows, page.bytes))
  return next.kind === 'NEXT' ? { kind: 'PAGE', rows, next: next.place } : next
}
