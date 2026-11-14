import { z } from 'zod'
import type { InventoryEntry, InventoryPage } from '../kernel/inventory.ts'
import { InventoryInput, InventoryPageSchema } from '../kernel/inventory.ts'
import { defineOperation } from '../kernel/operation.ts'
import { gatewayAnswer } from './answers.ts'
import { QueriedShape, queryRequest } from './door.ts'
import { pageSql } from './search-sql.ts'

/*
 * The dictionary in three phases, each in the order of its key (`SKILL.md`, "The dictionary"): the
 * tables (`TDDTAB`), the fields (`TDDCAM`, `ADICIONAL` marks the company's own) and what each value
 * of a coded field means (`TDDOPC`, by `NUCAMPO`). Every row leaves under the same eight aliases and
 * the phase it belongs to, so the answer, which never sees the input, knows what it read and where
 * the next page starts. No row of the company's data is read.
 */
const PHASES = ['TABLE', 'FIELD', 'CODE'] as const
type Phase = (typeof PHASES)[number]

/** Where the next page starts: the phase and the last key read in it (text, quoted when written). */
const Cursor = z.object({
  phase: z.enum(PHASES),
  after: z.array(z.string().max(60)).max(2).nullable(),
})
type Cursor = z.infer<typeof Cursor>

type CursorRead =
  | Readonly<{ kind: 'CURSOR'; cursor: Cursor }>
  | Readonly<{ kind: 'UNREADABLE'; reason: string }>

/** The cursor as the page before it wrote it: JSON text of a `Cursor`. */
function readCursor(text: string | null): CursorRead {
  if (text === null) return { kind: 'CURSOR', cursor: { phase: 'TABLE', after: null } }
  try {
    return { kind: 'CURSOR', cursor: Cursor.parse(JSON.parse(text)) }
  } catch (error) {
    return { kind: 'UNREADABLE', reason: String(error) }
  }
}

/** The first page's cursor is the start of the first phase. */
function cursorOf(text: string | null): Cursor {
  const read = readCursor(text)
  if (read.kind === 'UNREADABLE') throw new Error(`Cursor do inventário ilegível: ${read.reason}`)
  return read.cursor
}

type Keys = readonly { column: string; numeric: boolean }[]
const PHASE_SQL: Readonly<Record<Phase, { select: string; from: string; keys: Keys }>> = {
  TABLE: {
    select: `'TABLE' AS KIND, T.NOMETAB AS A, NULL AS B, NULL AS V, NULL AS TP, NULL AS LB, 'N' AS CU, T.NOMETAB AS K0, NULL AS K1`,
    from: 'TDDTAB T',
    keys: [{ column: 'T.NOMETAB', numeric: false }],
  },
  FIELD: {
    select: `'FIELD' AS KIND, C.NOMETAB AS A, C.NOMECAMPO AS B, NULL AS V, C.TIPCAMPO AS TP, C.DESCRCAMPO AS LB, CASE WHEN C.ADICIONAL = 'S' THEN 'S' ELSE 'N' END AS CU, C.NOMETAB AS K0, C.NOMECAMPO AS K1`,
    from: 'TDDCAM C',
    keys: [
      { column: 'C.NOMETAB', numeric: false },
      { column: 'C.NOMECAMPO', numeric: false },
    ],
  },
  CODE: {
    select: `'CODE' AS KIND, C.NOMETAB AS A, C.NOMECAMPO AS B, O.VALOR AS V, NULL AS TP, O.OPCAO AS LB, 'N' AS CU, O.NUCAMPO AS K0, O.VALOR AS K1`,
    from: 'TDDOPC O JOIN TDDCAM C ON C.NUCAMPO = O.NUCAMPO',
    keys: [
      { column: 'O.NUCAMPO', numeric: true },
      { column: 'O.VALOR', numeric: false },
    ],
  },
}

function literal(value: string, numeric: boolean): string {
  if (!numeric) return `'${value.replaceAll("'", "''")}'`
  return z
    .string()
    .regex(/^\d{1,18}$/)
    .parse(value)
}

/** Past the last key read, in key order: `(K1 > a) OR (K1 = a AND K2 > b)`. */
function pastKey(keys: Keys, after: readonly string[] | null): string | undefined {
  if (after === null) return undefined
  const each = keys.map(({ column, numeric }, at) =>
    [
      ...keys
        .slice(0, at)
        .map((before, i) => `${before.column} = ${literal(after[i] ?? '', before.numeric)}`),
      `${column} > ${literal(after[at] ?? '', numeric)}`,
    ].join(' AND '),
  )
  return `(${each.map((part) => `(${part})`).join(' OR ')})`
}

/** The one statement of a page of the cursor's phase. */
export function inventoryStatement(input: { cursor: string | null; limit: number }): string {
  const { phase, after } = cursorOf(input.cursor)
  const { select, from, keys } = PHASE_SQL[phase]
  return pageSql({
    select: [select],
    from,
    where: [pastKey(keys, after)],
    order: keys.map(({ column }) => column).join(', '),
    limit: input.limit,
  })
}

const COLUMNS = ['KIND', 'A', 'B', 'V', 'TP', 'LB', 'CU', 'K0', 'K1', 'EXTRA']

function text(cell: unknown): string | null {
  return typeof cell === 'string' || typeof cell === 'number' ? String(cell) : null
}

function entryOf(row: readonly unknown[]): InventoryEntry | undefined {
  const [, a, b, v, tp, lb, cu] = row.map(text)
  const kind = Cursor.shape.phase.safeParse(row[0]).data
  if (typeof a !== 'string' || kind === undefined) return undefined
  const name = kind === 'TABLE' ? a : kind === 'FIELD' ? `${a}.${b}` : `${a}.${b}=${v}`
  return {
    kind,
    name: name.slice(0, 200),
    type: tp?.slice(0, 20) ?? null,
    label: lb?.slice(0, 200) ?? null,
    custom: cu === 'S',
  }
}

/** What the DbExplorer answers to a page: the entries, and where the next page starts (the same phase while rows remain, else the next one). */
const QueriedInventory = QueriedShape.transform(
  ({ fieldsMetadata, rows, burstLimit }, context): InventoryPage => {
    if (fieldsMetadata.map(({ name }) => name).join() !== COLUMNS.join()) {
      context.addIssue({
        code: 'custom',
        path: ['fieldsMetadata'],
        message: 'not an inventory page',
      })
      return z.NEVER
    }
    const entries: InventoryEntry[] = []
    let last: readonly unknown[] | undefined
    let extra = false
    for (const [at, row] of rows.entries()) {
      if (row.at(-1) === 'S') {
        extra = true
        continue
      }
      const entry = entryOf(row)
      if (entry === undefined) {
        context.addIssue({ code: 'custom', path: ['rows', at], message: 'entry' })
        return z.NEVER
      }
      entries.push(entry)
      last = row
    }
    // A page with no row names no phase: the dictionary has nothing more to read (no tables, no fields, or no options).
    const phase = Cursor.shape.phase.safeParse(last?.[0]).data
    return { entries, next: nextOf(phase, last, extra || burstLimit === true) }
  },
)

function nextOf(
  phase: Phase | undefined,
  last: readonly unknown[] | undefined,
  more: boolean,
): string | null {
  if (phase === undefined) return null
  if (more && last !== undefined) {
    const after = [text(last[7]), text(last[8])].filter((key) => key !== null)
    return JSON.stringify({ phase, after } satisfies Cursor)
  }
  const following = PHASES[PHASES.indexOf(phase) + 1]
  return following === undefined ? null : JSON.stringify({ phase: following, after: null })
}

/** The input and the cursor it carries, judged before any SQL is written. */
const InventoryRead = InventoryInput.refine(({ cursor }) => readCursor(cursor).kind === 'CURSOR', {
  path: ['cursor'],
  message: 'Cursor inválido.',
})

/** One page of the company's dictionary: tables, then fields, then the options of coded fields. */
export const lerInventario = defineOperation({
  id: 'lerInventario',
  class: 'read' as const,
  subject: 'porta',
  idempotent: true,
  summary: 'Lê uma página do dicionário de dados: tabelas, campos e o significado de cada código.',
  label: 'Dicionário de dados',
  input: InventoryRead,
  output: InventoryPageSchema,
  probe: () => null,
  request: (input) => queryRequest(inventoryStatement(input)),
  answer: (answer) => gatewayAnswer(answer, QueriedInventory),
})
