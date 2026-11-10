import type { AppCell, AppTableName, Next } from '@conexus/hub-api'
import { CELL_CHARACTERS, PAGE_SIZE } from '@conexus/hub-api'
import { z } from 'zod'
import { quoted } from '../../platform/app-sql.ts'
import { Failure } from '../../platform/failure.ts'
import { pageKey, pageOf } from '../../platform/pages.ts'
import type { AppDatabaseDeps } from './app-database.ts'
import { readAppData } from './app-database.ts'
import type { AppDataFailed, AppReadInput, AppTable, TableSchema } from './app-tables.ts'
import { appTableOf } from './app-tables.ts'

export type AppRowsRead =
  | { kind: 'ROWS'; columns: { name: string }[]; rows: AppCell[][]; next: Next }
  | { kind: 'NONE' }
  | AppDataFailed

/** Where a page starts, in rows: the page token's text, a positive whole number of at most nine digits. */
const Offset = z.string().regex(/^[1-9]\d{0,8}$/)

const Cells = z.array(z.array(z.string().nullable()))

/**
 * A cell as the Hub shows it: the text PostgreSQL wrote, cut to the characters a cell shows. The read
 * asks for one more than that, so a text that passes it was cut; it never splits a surrogate pair.
 */
function cellOf(text: string | null): AppCell {
  if (text === null) return null
  if (text.length <= CELL_CHARACTERS) return { text, cut: false }
  const end = /[\uD800-\uDBFF]/.test(text.charAt(CELL_CHARACTERS - 1))
    ? CELL_CHARACTERS - 1
    : CELL_CHARACTERS
  return { text: text.slice(0, end), cut: true }
}

/** The page's statement: every column as text cut in the database, in key order or, with no key, by `ctid`. */
function pageStatement(table: AppTable, offset: number) {
  const columns = table.columns.map(
    ({ name }) => `left((${quoted(name)})::text, ${CELL_CHARACTERS + 1})`,
  )
  const order = table.key.length === 0 ? 'ctid' : table.key.map(quoted).join(', ')
  return {
    text: `select ${columns.join(', ')} from ${quoted(table.schema)}.${quoted(table.name)} order by ${order} limit $1 offset $2`,
    values: [PAGE_SIZE + 1, offset],
  }
}

/** One page of a table, its name checked against the catalog before any row is read. */
export async function appRowsOf(
  deps: AppDatabaseDeps,
  input: AppReadInput & { schema: TableSchema; name: AppTableName; page: string | undefined },
): Promise<AppRowsRead> {
  const offset = Number(pageKey(input.page, Offset) ?? 0)
  const found = await appTableOf(deps, input)
  if (found.kind === 'NO_APP' || found.kind === 'NONE') return { kind: 'NONE' }
  if (found.kind === 'FAILED') return found
  const [table] = found.tables
  if (table === undefined) return { kind: 'NONE' }
  const read = await readAppData(deps, { ...input, statement: pageStatement(table, offset) })
  switch (read.kind) {
    case 'FAILED':
      return read.code === 'APP_DATA_NO_APP'
        ? { kind: 'NONE' }
        : { kind: 'FAILED', code: read.code }
    case 'REFUSED':
      throw new Failure('INTERNAL_UNEXPECTED', {
        details: { reason: 'APP_ROWS_UNREADABLE', answer: read.kind },
      })
    case 'ROWS': {
      const cells = Cells.safeParse(read.rows)
      if (!cells.success) {
        throw new Failure('INTERNAL_UNEXPECTED', {
          details: { reason: 'APP_ROWS_UNREADABLE', answer: 'SHAPE' },
          cause: cells.error,
        })
      }
      const page = pageOf(cells.data, () => String(offset + PAGE_SIZE))
      return {
        kind: 'ROWS',
        columns: table.columns.map(({ name }) => ({ name })),
        rows: page.rows.map((row) => row.map(cellOf)),
        next: page.next,
      }
    }
    default:
      return read satisfies never
  }
}
