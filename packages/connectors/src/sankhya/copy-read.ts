import { z } from 'zod'
import type { CopyPage } from '../kernel/copy.ts'
import { CopyColumnType, CopyPageSchema, PageInput } from '../kernel/copy.ts'
import { defineOperation } from '../kernel/operation.ts'
import { gatewayAnswer } from './answers.ts'
import { QueriedShape, queryRequest } from './door.ts'
import { isOneReadStatement } from './read-only-sql.ts'
import { pageSql } from './search-sql.ts'

/*
 * Each column leaves under an alias that carries its place and its type (`C3_D`), so the answer,
 * which never sees the input, writes every cell as its type's canonical text.
 */
const MARK: Readonly<Record<CopyColumnType, string>> = {
  text: 'T',
  numeric: 'N',
  bigint: 'B',
  date: 'D',
  timestamp: 'S',
  boolean: 'L',
}
const TYPE_OF = new Map(CopyColumnType.options.map((type) => [MARK[type], type]))
const ALIAS = /^C(\d{1,3})_([TNBDSL])$/

/** A column in Sankhya's dialect: as it is when plain upper case, else quoted (the name pattern has no quote in it). */
function named(column: string): string {
  return /^[A-Z][A-Z0-9_]*$/.test(column) ? `Q.${column}` : `Q."${column}"`
}

/** A date of the input (`z.iso.date()` made it digits and dashes) in the literal decision 0063 measured. */
export function dated(day: string): string {
  return `TO_DATE('${day}', 'YYYY-MM-DD')`
}

/** The dates of the pass: changed since the watermark, or inside the window; none when the source says no change date or the pass has no watermark yet (it reads all, so a row with no date comes too). */
function dates({ definition, since, windowFrom }: PageInput): string | undefined {
  if (definition.changedSince === null || since === null) return undefined
  const changed = `${named(definition.changedSince.column)} >= ${dated(since)}`
  if (definition.window === undefined || windowFrom === null) return changed
  return `(${changed} OR ${named(definition.window.column)} >= ${dated(windowFrom)})`
}

/** Past the last key read, in key order: `(K1 > a) OR (K1 = a AND K2 > b)`. */
function pastKey(key: readonly string[], after: readonly number[] | null): string | undefined {
  if (after === null) return undefined
  const each = key.map((column, at) =>
    [
      ...key.slice(0, at).map((before, i) => `${named(before)} = ${after[i]}`),
      `${named(column)} > ${after[at]}`,
    ].join(' AND '),
  )
  return `(${each.map((part) => `(${part})`).join(' OR ')})`
}

/** The one statement of a page: the stored query as `Q`, the dates and the key added here, one row more than `limit`. */
export function pageStatement(page: PageInput): string {
  const { definition } = page
  return pageSql({
    select: definition.columns.map(
      ({ name, type }, at) => `${named(name)} AS C${at}_${MARK[type]}`,
    ),
    from: `(${definition.source.sql}) Q`,
    where: [dates(page), pastKey(definition.key, page.after)],
    order: definition.key.map(named).join(', '),
    limit: page.limit,
  })
}

const SANKHYA_DATE = /^(\d{2})(\d{2})(\d{4}) (\d{2}):(\d{2}):(\d{2})$/
const DECIMAL = /^-?\d+(\.\d+)?$/
const WHOLE = /^-?\d+$/
const FLAGS: Readonly<Record<string, string>> = {
  S: 'true',
  N: 'false',
  true: 'true',
  false: 'false',
}

type Canonical = string | null | undefined

function canonicalNumber(cell: unknown, pattern: RegExp, whole: boolean): Canonical {
  if (typeof cell === 'number')
    return (whole ? Number.isSafeInteger(cell) : Number.isFinite(cell)) ? String(cell) : undefined
  return typeof cell === 'string' && pattern.test(cell) ? cell : undefined
}

function canonicalDate(type: 'date' | 'timestamp', cell: unknown): Canonical {
  const [, day, month, year, hour, minute, second] =
    typeof cell === 'string' ? (SANKHYA_DATE.exec(cell) ?? []) : []
  if (year === undefined) return undefined
  const date = `${year}-${month}-${day}`
  return type === 'date' ? date : `${date}T${hour}:${minute}:${second}`
}

/** A cell as its type's canonical text, null for null, undefined when it is not a value of that type. */
function canonical(type: CopyColumnType, cell: unknown): Canonical {
  if (cell === null) return null
  switch (type) {
    case 'text':
      return typeof cell === 'string' ? cell : typeof cell === 'number' ? String(cell) : undefined
    case 'numeric':
      return canonicalNumber(cell, DECIMAL, false)
    case 'bigint':
      return canonicalNumber(cell, WHOLE, true)
    case 'date':
    case 'timestamp':
      return canonicalDate(type, cell)
    case 'boolean':
      return FLAGS[String(cell)]
    default:
      return type satisfies never
  }
}

/** What the DbExplorer answers to a page, each cell written by the type its alias carries; the row past `limit` dropped and read as `more`. */
const QueriedPage = QueriedShape.transform(
  ({ fieldsMetadata, rows, burstLimit }, context): CopyPage => {
    const columns = fieldsMetadata.slice(0, -1).map(({ name }, at) => {
      const [, place, mark] = ALIAS.exec(name) ?? []
      return Number(place) === at ? TYPE_OF.get(mark ?? '') : undefined
    })
    if (fieldsMetadata.at(-1)?.name !== 'EXTRA' || columns.some((type) => type === undefined)) {
      context.addIssue({ code: 'custom', path: ['fieldsMetadata'], message: 'not a page' })
      return z.NEVER
    }
    const read: (string | null)[][] = []
    let extra = false
    for (const [r, row] of rows.entries()) {
      if (row.at(-1) === 'S') {
        extra = true
        continue
      }
      const cells = columns.map((type, c) => canonical(type ?? 'text', row[c]))
      const bad = cells.indexOf(undefined)
      if (bad !== -1 || row.length !== columns.length + 1) {
        context.addIssue({ code: 'custom', path: ['rows', r, Math.max(bad, 0)], message: 'cell' })
        return z.NEVER
      }
      read.push(cells.map((cell) => cell ?? null))
    }
    return { rows: read, more: extra || burstLimit === true }
  },
)

/** The input, and the whole statement it makes judged by the read filter: a stored query the filter refuses never reaches Sankhya. */
const PageRead = PageInput.refine((page) => isOneReadStatement(pageStatement(page)), {
  path: ['definition', 'source', 'sql'],
  message:
    'A consulta não passa no filtro de leitura: uma instrução SELECT ou WITH, só de leitura.',
})

/** One page of a copy: the stored query ordered by its key, from past the last key read, with the pass's dates. */
export const lerPagina = defineOperation({
  id: 'lerPagina',
  class: 'read' as const,
  subject: 'porta',
  idempotent: true,
  summary:
    'Lê uma página de uma cópia: a consulta guardada, em ordem de chave, depois da última chave lida.',
  label: 'Página de uma cópia',
  input: PageRead,
  output: CopyPageSchema,
  probe: () => null,
  request: (page) => queryRequest(pageStatement(page)),
  answer: (answer) => gatewayAnswer(answer, QueriedPage),
})
