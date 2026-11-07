import { connectorOf } from '@conexus/connectors'
import type { CompanyId, ConnectionId, PersonId, ProjectId } from '@conexus/hub-api'
import { CALL_DEADLINE_MS, ConnectionId as ConnectionIdSchema, OperationId } from '@conexus/hub-api'
import { z } from 'zod'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { Speaker } from '../identity/public.ts'
import type { GrantedConnection, ShapedRead, Spent } from './builder-port.ts'
import { createSpending, described, offeredIn } from './builder-port.ts'
import { shaped } from './cut.ts'
import { readOf } from './grants.ts'
import type { NoteSaved } from './notes.ts'
import { Notes, provedAndSaved } from './notes.ts'
import type { NotInRole } from './read.ts'
import { readThrough } from './read.ts'
import type { Deps } from './rows.ts'
import { scopeOf } from './rows.ts'
import { mayUseNotebook, visibleTo } from './speaking.ts'
import { openedIn } from './testing.ts'

/** Where a conversation lives: it decides which connections it may choose (C21). */
type Place = { kind: 'COMPANY' } | { kind: 'PROJECT'; projectId: ProjectId }

/** A conversation's scope, read from its thread on each turn (U2); the role is checked on every call. */
export type SessionScope = {
  companyId: CompanyId
  personId: PersonId
  place: Place
  chosen: readonly ConnectionId[]
  /**
   * Set where a published (or draft) agent version converses: it reads by what the version
   * declares, not by the role of the person who talks to it (decision C1).
   */
  agentVersion?: Extract<Speaker, { kind: 'VERSION' }>
}

type AssistantConnection = {
  connectionId: ConnectionId
  connector: string
  name: string
  reads: readonly { operation: string; label: string; summary: string }[]
  skill: GrantedConnection['skill']
  chosen: boolean
}

/** The turn a call belongs to: a uuid the Assistant's takeTurn puts on the run's context (U2). */
export const TurnKey = z.uuid().brand('TurnKey')
export type TurnKey = z.infer<typeof TurnKey>

/** The Builder's answer (builder-port.ts); an OK one also carries the connector's answer before the cut. */
type AssistantRead =
  | (Extract<ShapedRead, { kind: 'OK' }> & { whole: unknown })
  | Exclude<ShapedRead, { kind: 'OK' }>
  | Spent

export type AssistantConnectors = {
  /** What the place offers (company: usable; Projeto: usable and released to it), each with chosen; [] for a person who may not ask, a removed one included. */
  connections(scope: SessionScope): Promise<readonly AssistantConnection[]>
  /** One read of a chosen, offered connection, read class only. */
  read(
    scope: SessionScope,
    call: {
      connectionId: ConnectionId
      turn: TurnKey
      operation: string
      input: unknown
      /** The turn's stop: a read waiting in its connection's line leaves it at once. */
      signal?: AbortSignal
    },
  ): Promise<AssistantRead>
  /** The connection's caderno, under the same check as read. */
  notes(scope: SessionScope, connectionId: ConnectionId): Promise<Notes | NotInRole | null>
  /** One concept in the caderno, proved once by the read door; only for `manageConnections`. */
  saveNote(
    scope: SessionScope,
    call: {
      connectionId: ConnectionId
      turn: TurnKey
      concept: string
      mapping: string
      provingQuery: string
    },
  ): Promise<NoteSaved | Spent>
  /**
   * The input of one read of a connection the place offers, whose top-level fields an agent's tool
   * fixes or leaves to the model (step 24.3, U1); none for a connection not offered, an operation
   * that is not a read, or one whose input is not an object.
   */
  operationOf(
    scope: SessionScope,
    target: { connectionId: ConnectionId; operation: string },
  ): Promise<z.ZodObject | undefined>
  /**
   * The kit's typed reads of every connection the place offers, the read door's left out: what a
   * version written before decision E4 reads as its connections' tools.
   */
  kitReads(scope: SessionScope): Promise<readonly KitRead[]>
}

export type KitRead = Readonly<{
  connectionId: ConnectionId
  operation: OperationId
  summary: string
  open: readonly string[]
}>

/** The ids of the line and of the query: the Projeto only where the conversation lives in one. */
function idsOf(scope: SessionScope) {
  return scope.place.kind === 'PROJECT'
    ? { companyId: scope.companyId, projectId: scope.place.projectId }
    : { companyId: scope.companyId }
}

/**
 * Whether the person may ask now: admission reads their role on every call (S10), the same way as
 * the Assistant's routes. A refusal is `false` for the caller and its reason in the log only.
 */
async function mayAsk(deps: Deps, tx: ReadTx, scope: SessionScope): Promise<Speaker | undefined> {
  try {
    const admitted = await deps.identity.admitMember({
      tx,
      personId: scope.personId,
      companyId: scope.companyId,
      action: 'askAssistant',
    })
    return scope.agentVersion ?? { kind: 'PERSON', personId: scope.personId, role: admitted.role }
  } catch (error) {
    if (!(error instanceof Failure) || error.code !== 'NOT_FOUND') throw error
    const reason = String(error.details.reason ?? 'NOT_FOUND')
    const { companyId, personId } = scope
    deps.log.info({ companyId, personId, reason }, 'ASSISTANT_NOT_ADMITTED')
    return undefined
  }
}

/** What the conversation's place offers to a person who may ask now, whether chosen or not, in one short transaction. */
function offered(deps: Deps, scope: SessionScope) {
  return deps.database.read(scopeOf(viewerOf(scope)), async (tx) =>
    (await mayAsk(deps, tx, scope)) ? offeredIn(tx, idsOf(scope)) : [],
  )
}

/** The same rows, with who speaks for the conversation: none for a person who may not ask. */
function offeredTo(deps: Deps, scope: SessionScope) {
  return deps.database.read(scopeOf(viewerOf(scope)), async (tx) => {
    const speaker = await mayAsk(deps, tx, scope)
    return speaker === undefined ? undefined : { speaker, rows: await offeredIn(tx, idsOf(scope)) }
  })
}

/** Why the conversation may not read a connection: the caller hears NOT_GRANTED alone (S10). */
type Refusal = 'NOT_CHOSEN' | 'NOT_ADMITTED' | 'NOT_OFFERED' | 'NOT_A_READ'

/**
 * The one connection the conversation chose and its place offers, handed to `use` in the same
 * transaction that decided it (D22, S8); none gives the reason, which the caller logs and answers
 * as NOT_GRANTED (S10). The owner of "what a conversation may read" (C26): the notebook and every
 * read go through it.
 */
async function readable<T>(
  deps: Deps,
  scope: SessionScope,
  connectionId: ConnectionId,
  use: (tx: ReadTx, row: { notes: unknown; connector: string }, speaker: Speaker) => Promise<T>,
): Promise<{ kind: 'OK'; value: T } | { kind: Refusal }> {
  if (!scope.chosen.includes(connectionId)) return { kind: 'NOT_CHOSEN' }
  return deps.database.read(scopeOf(viewerOf(scope)), async (tx) => {
    const speaker = await mayAsk(deps, tx, scope)
    if (speaker === undefined) return { kind: 'NOT_ADMITTED' }
    const [row] = await offeredIn(tx, idsOf(scope), connectionId)
    return row === undefined
      ? { kind: 'NOT_OFFERED' }
      : { kind: 'OK', value: await use(tx, row, speaker) }
  })
}

/** A refusal of the Assistant's read, notebook or note, its reason in the log (S10: the model hears NOT_GRANTED). */
function refused(
  deps: Deps,
  scope: SessionScope,
  about: { connectionId: ConnectionId; operation?: string; reason: Refusal },
  event: 'ASSISTANT_READ_REFUSED' | 'CONNECTION_NOTE_REFUSED' = 'ASSISTANT_READ_REFUSED',
) {
  const { companyId, personId } = scope
  deps.log.info({ companyId, personId, ...about }, event)
  return { kind: 'NOT_GRANTED' } as const
}

function viewerOf(scope: SessionScope) {
  return { person: { id: scope.personId }, companyId: scope.companyId }
}

/** The chosen connection its place offers, opened; none once the refusal is logged as `event`. */
async function chosenOpened(
  deps: Deps,
  scope: SessionScope,
  connectionId: ConnectionId,
  event?: Parameters<typeof refused>[3],
) {
  const found = await readable(deps, scope, connectionId, async (tx, _row, speaker) => ({
    opened: await openedIn(deps, tx, { companyId: scope.companyId, connectionId }),
    speaker,
  }))
  if (found.kind === 'OK') return found.value
  refused(deps, scope, { connectionId, reason: found.kind }, event)
  return undefined
}

/**
 * The Assistant's note: the chosen connection its place offers, one of the turn's calls, then the
 * proof and the write, which checks `manageConnections` (step 24.3.5).
 */
async function noted(
  deps: Deps,
  spend: ReturnType<typeof createSpending>,
  scope: SessionScope,
  call: Parameters<AssistantConnectors['saveNote']>[1],
): Promise<NoteSaved | Spent> {
  const chosen = await chosenOpened(deps, scope, call.connectionId, 'CONNECTION_NOTE_REFUSED')
  if (chosen === undefined) return { kind: 'NOT_GRANTED' }
  if (!spend(call.turn)) return { kind: 'CALLS_SPENT' }
  const read = {
    by: 'assistant',
    ids: idsOf(scope),
    viewer: viewerOf(scope),
    speaker: chosen.speaker,
    opened: chosen.opened,
    deadlineMs: CALL_DEADLINE_MS,
  } as const
  return provedAndSaved(deps, { ...call, read })
}

/** The kit's typed reads of each row's connector, the read door's left out. */
function kitReadsOf(rows: readonly { id: string; connector: string }[]): KitRead[] {
  return rows.flatMap((row) =>
    (connectorOf(row.connector)?.operations ?? []).flatMap((operation) =>
      operation.class === 'read' && operation.input instanceof z.ZodObject
        ? [
            {
              connectionId: ConnectionIdSchema.parse(row.id),
              operation: OperationId.parse(operation.id),
              summary: operation.summary,
              open: Object.keys(operation.input.shape),
            },
          ]
        : [],
    ),
  )
}

/** The company's door for the Assistant (step 24.1, U1): the chosen connections its place offers, `by: 'assistant'`; the caderno's write only for `manageConnections` (step 24.3.5). */
export function createAssistantConnectors(deps: Deps): AssistantConnectors {
  const spend = createSpending()
  return {
    async connections(scope) {
      const chosen = new Set(scope.chosen)
      const found = await offeredTo(deps, scope)
      if (found === undefined) return []
      const shown = await visibleTo(deps, scope.companyId, found.speaker, described(found.rows))
      return shown.map(({ connectionId, connector, name, reads, skill }) => ({
        connectionId,
        connector,
        name,
        reads,
        skill,
        chosen: chosen.has(connectionId),
      }))
    },

    async read(scope, call) {
      const { connectionId } = call
      const found = await chosenOpened(deps, scope, connectionId)
      if (found === undefined) return { kind: 'NOT_GRANTED' }
      const { opened: open, speaker } = found
      const operation = readOf(open.connector, call.operation)
      if (operation === undefined) {
        const about = { connectionId, operation: call.operation, reason: 'NOT_A_READ' } as const
        return refused(deps, scope, about)
      }
      if (!spend(call.turn)) return { kind: 'CALLS_SPENT' }
      const answered = await readThrough(deps, {
        by: 'assistant',
        ids: idsOf(scope),
        viewer: viewerOf(scope),
        speaker,
        opened: open,
        operation,
        input: call.input,
        deadlineMs: CALL_DEADLINE_MS,
        signal: call.signal,
      })
      return answered.kind === 'OK'
        ? { kind: 'OK', ...shaped(answered.value), whole: answered.value }
        : answered
    },

    async operationOf(scope, target) {
      const [row] = (await offered(deps, scope)).filter((each) => each.id === target.connectionId)
      const connector = row === undefined ? undefined : connectorOf(row.connector)
      const input = connector && readOf(connector, target.operation)?.input
      return input instanceof z.ZodObject ? input : undefined
    },

    async kitReads(scope) {
      return kitReadsOf((await offeredTo(deps, scope))?.rows ?? [])
    },

    async notes(scope, connectionId) {
      const found = await readable(deps, scope, connectionId, async (_, row, speaker) => {
        const refusal = await mayUseNotebook(deps, scope.companyId, speaker, {
          connectionId,
          connector: row.connector,
        })
        return refusal ?? Notes.parse(row.notes)
      })
      if (found.kind === 'OK') return found.value
      refused(deps, scope, { connectionId, reason: found.kind })
      return null
    },

    saveNote: (scope, call) => noted(deps, spend, scope, call),
  }
}
