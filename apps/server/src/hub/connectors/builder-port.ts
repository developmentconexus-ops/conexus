import type { ConnectorAnswer } from '@conexus/app-contract'
import type { Operation } from '@conexus/connectors'
import { connectorOf } from '@conexus/connectors'
import type { CompanyId, OfProject, PersonId, ProjectId, RunId } from '@conexus/hub-api'
import { CALL_DEADLINE_MS, ConnectionId } from '@conexus/hub-api'
import { and, asc, eq, inArray } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { shaped } from './cut.ts'
import type { OpenedConnection } from './executor.ts'
import { readOf } from './grants.ts'
import type { NoteSaved } from './notes.ts'
import { Notes, provedAndSaved } from './notes.ts'
import { readThrough } from './read.ts'
import type { Deps } from './rows.ts'
import { usable } from './rows.ts'
import { connection, projectConnection } from './tables.ts'
import { openedIn } from './testing.ts'

/** One conversation turn reads and saves at most this many times (the OS's `connector_fetch`: 50 per run); the Builder counts by run, the Assistant by turn. */
export const CONNECTOR_CALLS_PER_TURN = 50
export const TURNS_KEPT = 1000

export type GrantedConnection = Readonly<{
  connectionId: ConnectionId
  connector: string
  name: string
  perProject: 'one' | 'many'
  skill: Readonly<{ name: string; content: string; references: Readonly<Record<string, string>> }>
  reads: readonly Readonly<{ operation: string; label: string; summary: string }>[]
  notes: readonly string[]
}>
export type ShapedRead =
  | Readonly<{ kind: 'OK'; value: unknown; complete: boolean }>
  | Exclude<ConnectorAnswer, { kind: 'OK' }>
export type Spent = Readonly<{ kind: 'CALLS_SPENT' }>
type Of = Readonly<{ connectionId: ConnectionId; personId: PersonId; runId: RunId }>

export type BuilderConnectors = {
  granted(ids: OfProject): Promise<readonly GrantedConnection[]>
  read(
    ids: OfProject,
    a: Of & Readonly<{ operation: string; input: unknown; signal?: AbortSignal }>,
  ): Promise<ShapedRead | Spent>
  notes(ids: OfProject, connectionId: ConnectionId): Promise<Notes | null>
  saveNote(
    ids: OfProject,
    a: Of & Readonly<{ concept: string; mapping: string; provingQuery: string }>,
  ): Promise<NoteSaved>
}

/** The call counts by key (a run, a turn), the oldest forgotten past `TURNS_KEPT`; false once a key has spent its 50. */
export function createSpending(): (key: string) => boolean {
  const spent = new Map<string, number>()
  return (key) => {
    const used = (spent.get(key) ?? 0) + 1
    if (used > CONNECTOR_CALLS_PER_TURN) return false
    spent.delete(key)
    spent.set(key, used)
    const [oldest] = spent.keys()
    if (spent.size > TURNS_KEPT && oldest !== undefined) spent.delete(oldest)
    return true
  }
}

/**
 * The company's usable connections in the order the model is told of them. Where the reader works in a
 * Projeto only those released to it are offered: the place decides the join, the row is one shape (C26).
 */
export function offeredIn(
  tx: ReadTx,
  ids: Readonly<{ companyId: CompanyId; projectId?: ProjectId }>,
  connectionId?: ConnectionId,
) {
  return tx
    .select({
      id: connection.id,
      connector: connection.connectorId,
      name: connection.name,
      notes: connection.notes,
    })
    .from(connection)
    .where(
      and(
        eq(connection.companyId, ids.companyId),
        usable,
        ids.projectId === undefined
          ? undefined
          : inArray(
              connection.id,
              tx
                .select({ id: projectConnection.connectionId })
                .from(projectConnection)
                .where(eq(projectConnection.projectId, ids.projectId)),
            ),
        connectionId === undefined ? undefined : eq(connection.id, connectionId),
      ),
    )
    .orderBy(asc(connection.connectorId), asc(connection.linkedAt))
}

function grantedRows(deps: Deps, ids: OfProject, connectionId?: ConnectionId) {
  const scope = { kind: 'COMPANY', companyId: ids.companyId, personId: null } as const
  return deps.database.read(scope, (tx) => offeredIn(tx, ids, connectionId))
}

/** The connection opened when the Projeto may read it now; none otherwise (NOT_GRANTED to the caller). */
async function admit(deps: Deps, ids: OfProject, a: Of): Promise<OpenedConnection | undefined> {
  const [found] = await grantedRows(deps, ids, a.connectionId)
  if (found === undefined) return undefined
  const scope = { kind: 'COMPANY', companyId: ids.companyId, personId: a.personId } as const
  return deps.database.read(scope, (tx) =>
    openedIn(deps, tx, { companyId: ids.companyId, connectionId: ConnectionId.parse(found.id) }),
  )
}

function callThrough(
  deps: Deps,
  a: Readonly<{
    ids: OfProject
    personId: PersonId
    opened: OpenedConnection
    operation: Operation<unknown, unknown, 'read'>
    input: unknown
    signal?: AbortSignal
  }>,
) {
  return readThrough(deps, {
    by: 'builder',
    ids: a.ids,
    viewer: { person: { id: a.personId }, companyId: a.ids.companyId },
    opened: a.opened,
    operation: a.operation,
    input: a.input,
    deadlineMs: CALL_DEADLINE_MS,
    signal: a.signal,
  })
}

/** What the model is told of each row; a row of a connector the kit no longer has is left out. */
export function described(rows: Awaited<ReturnType<typeof offeredIn>>): GrantedConnection[] {
  return rows.flatMap((row) => {
    const connector = connectorOf(row.connector)
    if (connector === undefined) return []
    const reads = [...connector.operations, ...Object.values(connector.readDoor ?? {})]
    return [
      {
        connectionId: ConnectionId.parse(row.id),
        connector: connector.id,
        name: row.name,
        perProject: connector.perProject,
        skill: { name: `conexus-${connector.id}`, ...connector.skill },
        reads: reads
          .filter((operation) => operation.class === 'read')
          .map((operation) => ({
            operation: operation.id,
            label: operation.label,
            summary: operation.summary,
          })),
        notes: Object.keys(Notes.parse(row.notes)),
      },
    ]
  })
}

/** The Builder's door to the Projeto's granted connections (step 20, U3): read, notebook, and what the next turn is given. */
export function createBuilderConnectors(deps: Deps): BuilderConnectors {
  const spend = createSpending()
  return {
    granted: async (ids) => described(await grantedRows(deps, ids)),

    async read(ids, a) {
      const opened = await admit(deps, ids, a)
      const operation = opened && readOf(opened.connector, a.operation)
      if (opened === undefined || !operation) {
        const reason = opened === undefined ? 'NOT_GRANTED_TO_PROJECT' : 'NOT_A_READ'
        const { connectionId } = a
        const about = { ...ids, connectionId, operation: a.operation, reason }
        deps.log.info(about, 'BUILDER_READ_REFUSED')
        return { kind: 'NOT_GRANTED' }
      }
      if (!spend(a.runId)) return { kind: 'CALLS_SPENT' }
      const answered = await callThrough(deps, { ids, ...a, opened, operation })
      return answered.kind === 'OK' ? { kind: 'OK', ...shaped(answered.value) } : answered
    },

    async notes(ids, connectionId) {
      const [row] = await grantedRows(deps, ids, connectionId)
      return row === undefined ? null : Notes.parse(row.notes)
    },

    async saveNote(ids, a) {
      const opened = await admit(deps, ids, a)
      if (opened === undefined) return { kind: 'NOT_GRANTED' }
      // A connector with no read door has no notebook.
      const door = readOf(opened.connector, 'consultar')
      if (door === undefined || a.concept.length < 1 || a.concept.length > 120)
        return { kind: 'NOTE_INVALID' }
      if (!spend(a.runId)) return { kind: 'CALLS_SPENT' }
      const viewer = { person: { id: a.personId }, companyId: ids.companyId }
      const read = { by: 'builder', ids, viewer, opened, operation: door, deadlineMs: CALL_DEADLINE_MS } as const
      return provedAndSaved(deps, { ...a, read })
    },
  }
}
