import type { ConceptCall } from '@conexus/connectors'
import { ConceptRefused } from '@conexus/connectors'
import type { ConnectionId } from '@conexus/hub-api'
import { z } from 'zod'
import { readOf } from './grants.ts'
import type { NotInRole, ReadRequest } from './read.ts'
import { readThrough } from './read.ts'
import type { Deps } from './rows.ts'

/** A read as the opened connection's door takes it, all but the operation and its input: the person's or the turn's speaker, never a version. */
export type ConceptReader = Omit<ReadRequest, 'operation' | 'input'>

/** Why the system did not prove: the type of its answer, or `NO_QUERY` for a connector with no concept read. */
type Failed = Readonly<{ kind: 'FAILED'; reason: string }>
type Refused = NotInRole | Readonly<{ kind: 'CALLS_SPENT' }>

/** A proof: the rows counted and the columns of one row, each with the system's type; never a row. A role's proof counts its rows outside the base. */
export type ProofAnswer =
  | Readonly<{
      kind: 'OK'
      rows: number
      shape: readonly Readonly<{ column: string; type: string | null }>[]
      outsideBase?: number
    }>
  /** A role's key column the proof did not see. */
  | Readonly<{ kind: 'KEY_NOT_IN_SHAPE'; column: string }>
  | Failed
  | Refused

/** A concept's read the dialect would not write (`ConceptRefused`), or its rows. */
export type QueryAnswer =
  | Readonly<{ kind: 'OK'; rows: readonly Readonly<Record<string, unknown>>[] }>
  | Readonly<{ kind: 'CALL_REFUSED' }>
  | Failed
  | Refused

/** A role's proof: the base's proved query and the key pairs, the role's column first. */
export type RoleOf = Readonly<{ base: string; keys: readonly (readonly [string, string])[] }>

/** What the Ontology proves and reads through one opened connection, bound to who speaks and to the turn's 50 calls. */
export type ConceptDoor = Readonly<{
  connectionId: ConnectionId
  prove(sql: string, role?: RoleOf): Promise<ProofAnswer>
  query(call: ConceptCall): Promise<QueryAnswer>
}>

const Answered = z.object({
  linhas: z.array(z.record(z.string(), z.unknown())),
  colunas: z.array(z.object({ nome: z.string(), tipo: z.string().nullable() })),
})

const Counted = z.union([
  z.number().int().nonnegative(),
  z.string().regex(/^\d+$/).transform(Number),
])

function countOf(rows: readonly Record<string, unknown>[]): number | undefined {
  const parsed = Counted.safeParse(Object.values(rows[0] ?? {})[0])
  return parsed.success ? parsed.data : undefined
}

/**
 * The door of a connection for the Ontology (A Ontologia da empresa, U3): each statement the
 * connector's dialect writes runs once through `readThrough`, as `connector_read` runs one, so the
 * role, the personal data and the deadline are the door's; each spends one of the turn's calls. No
 * transaction is open meanwhile (D22).
 */
export function conceptDoorOf(
  deps: Deps,
  reader: ConceptReader,
  spend: () => boolean,
): ConceptDoor {
  const dialect = reader.opened.connector.conceptRead
  const operation =
    dialect === undefined ? undefined : readOf(reader.opened.connector, dialect.door)

  async function run(
    statement: () => string,
  ): Promise<z.infer<typeof Answered> | Failed | Refused | 'CALL_REFUSED'> {
    if (operation === undefined) return { kind: 'FAILED', reason: 'NO_QUERY' }
    let sql: string
    try {
      sql = statement()
    } catch (error) {
      if (error instanceof ConceptRefused) return 'CALL_REFUSED'
      throw error
    }
    if (!spend()) return { kind: 'CALLS_SPENT' }
    const answered = await readThrough(deps, { ...reader, operation, input: { sql } })
    if (answered.kind === 'NOT_IN_ROLE') return answered
    if (answered.kind !== 'OK') return { kind: 'FAILED', reason: answered.kind }
    const parsed = Answered.safeParse(answered.value)
    return parsed.success ? parsed.data : { kind: 'FAILED', reason: 'UNREADABLE' }
  }

  async function counted(statement: () => string): Promise<number | Failed | Refused> {
    const answered = await run(statement)
    if (answered === 'CALL_REFUSED') return { kind: 'FAILED', reason: 'REFUSED' }
    if ('kind' in answered) return answered
    return countOf(answered.linhas) ?? { kind: 'FAILED', reason: 'UNREADABLE' }
  }

  return {
    connectionId: reader.opened.id,
    async prove(sql, role) {
      if (dialect === undefined) return { kind: 'FAILED', reason: 'NO_QUERY' }
      const rows = await counted(() => dialect.count(sql))
      if (typeof rows !== 'number') return rows
      const page = await run(() => dialect.shape(sql))
      if (page === 'CALL_REFUSED') return { kind: 'FAILED', reason: 'REFUSED' }
      if ('kind' in page) return page
      const shape = page.colunas.map(({ nome, tipo }) => ({ column: nome, type: tipo }))
      if (role === undefined) return { kind: 'OK', rows, shape }
      const missing = role.keys.find(([column]) => !shape.some((each) => each.column === column))
      if (missing !== undefined) return { kind: 'KEY_NOT_IN_SHAPE', column: missing[0] }
      const outside = await counted(() => dialect.subset(sql, role.base, role.keys))
      if (typeof outside !== 'number') return outside
      return { kind: 'OK', rows, shape, outsideBase: outside }
    },
    async query(call) {
      if (dialect === undefined) return { kind: 'FAILED', reason: 'NO_QUERY' }
      const answered = await run(() => dialect.compile(call))
      if (answered === 'CALL_REFUSED') return { kind: 'CALL_REFUSED' }
      if ('kind' in answered) return answered
      return { kind: 'OK', rows: answered.linhas }
    },
  }
}
