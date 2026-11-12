import type { CopyDefinition } from '@conexus/connectors'
import { connectorOf } from '@conexus/connectors'
import type {
  CompanyId,
  CopyProposed,
  OfProject,
  PersonId,
  ProjectId,
  RunId,
} from '@conexus/hub-api'
import { CALL_DEADLINE_MS, ConnectionId } from '@conexus/hub-api'
import { and, asc, eq, inArray } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import type { Speaker } from '../identity/public.ts'
import type { Proved } from './copy-proof.ts'
import { provedPage } from './copy-proof.ts'
import { shaped } from './cut.ts'
import type { OpenedConnection } from './executor.ts'
import { readOf } from './grants.ts'
import type { NoteSaved } from './notes.ts'
import { Notes, provedAndSaved } from './notes.ts'
import type { NotInRole, ReadAnswer } from './read.ts'
import { readThrough } from './read.ts'
import type { Deps } from './rows.ts'
import { usable } from './rows.ts'
import { mayUseNotebook, personSpeaker, visibleTo } from './speaking.ts'
import { connection, projectConnection } from './tables.ts'
import { openedIn } from './testing.ts'

/** One conversation turn reads and saves at most this many times; it protects the company's system, counted at the Hub's door, also for code mode. The Builder counts by run, the Assistant by turn. */
export const CONNECTOR_CALLS_PER_TURN = 50
export const TURNS_KEPT = 1000

export type GrantedConnection = Readonly<{
  connectionId: ConnectionId
  connector: string
  name: string
  perProject: 'one' | 'many'
  skill: Readonly<{ name: string; content: string; references: Readonly<Record<string, string>> }>
  reads: readonly Readonly<{ operation: string; label: string; summary: string }>[]
  /** The writes the connector declares (step 24.5): an agent's tool may be one, never a read of the Builder or the Assistant. */
  writes: readonly Readonly<{ operation: string; label: string; summary: string }>[]
  notes: readonly string[]
  /** The connector copies through its free read door (definition version 1, `QUERY`): `copy_propose` is offered (Capacidade 3). */
  copies: boolean
}>
export type ShapedRead =
  | Readonly<{ kind: 'OK'; value: unknown; complete: boolean; rows: number; bytes: number }>
  | Exclude<ReadAnswer, { kind: 'OK' }>
  | Readonly<{ kind: 'NOT_GRANTED' }>
  | NotInRole
export type Spent = Readonly<{ kind: 'CALLS_SPENT' }>
/** Why the Builder's read or proof brought nothing: the source's refusal whole, as `connector_read` gets it. */
type BuilderReadRefusal = Exclude<ShapedRead, { kind: 'OK' }> | Spent

/** What proposing a copy answers to the model (`hub/copies/propose.ts` writes it). */
export type ProposeAnswer =
  | CopyProposed
  /** A copy of the company or an open proposal has the name; `releasedHere` when it is a copy released to this Projeto. */
  | Readonly<{ kind: 'EXISTS'; name: string; releasedHere: boolean }>
  /** `CopyDefinition`'s paths and messages, or the name's. */
  | Readonly<{ kind: 'MALFORMED'; issues: string[] }>
  | BuilderReadRefusal

/** What proposing takes: the Projeto and the person of the turn, the run its call counts in, what the model wrote. */
export type Proposal = Readonly<{
  connectionId: ConnectionId
  personId: PersonId
  runId: RunId
  name: string
  label: string
  definition: unknown
  signal: AbortSignal
}>

/** `hub/copies` proposes; `main.ts` hands it here, since the Builder never imports `hub/copies` (C4). */
export type Propose = (ids: OfProject, a: Proposal) => Promise<ProposeAnswer>
type Of = Readonly<{ connectionId: ConnectionId; personId: PersonId; runId: RunId }>
type Asking = OfProject & Readonly<{ personId: PersonId }>

export type BuilderConnectors = {
  granted(ids: Asking): Promise<readonly GrantedConnection[]>
  read(
    ids: OfProject,
    a: Of & Readonly<{ operation: string; input: unknown; signal?: AbortSignal }>,
  ): Promise<ShapedRead | Spent>
  notes(ids: Asking, connectionId: ConnectionId): Promise<Notes | NotInRole | null>
  saveNote(
    ids: OfProject,
    a: Of & Readonly<{ concept: string; mapping: string; provingQuery: string }>,
  ): Promise<NoteSaved | Spent>
  /** One page of the copy read, as the person may read the connection: the count, never a row. */
  provePage(
    ids: OfProject,
    a: Of & Readonly<{ definition: CopyDefinition; signal: AbortSignal }>,
  ): Promise<Proved | BuilderReadRefusal>
  /** A copy proposed in the Projeto's conversation, proved by one page; `hub/copies` owns it. */
  propose: Propose
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

/** The Builder's read as the connector's door takes it, all but the operation and its input. */
function readerOf(
  a: Readonly<{
    ids: OfProject
    personId: PersonId
    speaker: Speaker
    opened: OpenedConnection
    signal?: AbortSignal
  }>,
) {
  return {
    by: 'builder',
    ids: a.ids,
    viewer: { person: { id: a.personId }, companyId: a.ids.companyId },
    speaker: a.speaker,
    opened: a.opened,
    deadlineMs: CALL_DEADLINE_MS,
    signal: a.signal,
  } as const
}

/** What the model is told of each row; a row of a connector the kit no longer has is left out. */
function listedOf(operation: { id: string; label: string; summary: string }) {
  return { operation: operation.id, label: operation.label, summary: operation.summary }
}

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
        reads: reads.filter((operation) => operation.class === 'read').map(listedOf),
        writes: (connector.writes ?? []).map(listedOf),
        notes: Object.keys(Notes.parse(row.notes)),
        copies: connector.copy !== undefined && connector.readDoor !== undefined,
      },
    ]
  })
}

/** The Builder's door to the Projeto's granted connections (step 20, U3): read, notebook, and what the next turn is given. */
export function createBuilderConnectors(
  deps: Deps & { propose: () => Propose },
): BuilderConnectors {
  const spend = createSpending()
  return {
    async granted(ids) {
      const speaker = await personSpeaker(deps, ids.companyId, ids.personId)
      if (speaker === undefined) return []
      return visibleTo(deps, ids.companyId, speaker, described(await grantedRows(deps, ids)))
    },

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
      const speaker = await personSpeaker(deps, ids.companyId, a.personId)
      if (speaker === undefined) return { kind: 'NOT_GRANTED' }
      if (!spend(a.runId)) return { kind: 'CALLS_SPENT' }
      const answered = await readThrough(deps, {
        ...readerOf({ ids, ...a, speaker, opened }),
        operation,
        input: a.input,
      })
      return answered.kind === 'OK' ? { kind: 'OK', ...shaped(answered.value) } : answered
    },

    async notes(ids, connectionId) {
      const [row] = await grantedRows(deps, ids, connectionId)
      if (row === undefined) return null
      const speaker = await personSpeaker(deps, ids.companyId, ids.personId)
      if (speaker === undefined) return null
      const refused = await mayUseNotebook(deps, ids.companyId, speaker, {
        connectionId,
        connector: row.connector,
      })
      return refused ?? Notes.parse(row.notes)
    },

    async saveNote(ids, a) {
      const opened = await admit(deps, ids, a)
      if (opened === undefined) return { kind: 'NOT_GRANTED' }
      const speaker = await personSpeaker(deps, ids.companyId, a.personId)
      if (speaker === undefined) return { kind: 'NOT_GRANTED' }
      if (!spend(a.runId)) return { kind: 'CALLS_SPENT' }
      const read = readerOf({ ids, ...a, speaker, opened })
      return provedAndSaved(deps, { ...a, read })
    },

    async provePage(ids, a) {
      const opened = await admit(deps, ids, a)
      return provedPage(deps, { ...a, ids, opened, spend: () => spend(a.runId) })
    },

    propose: (ids, a) => deps.propose()(ids, a),
  }
}
