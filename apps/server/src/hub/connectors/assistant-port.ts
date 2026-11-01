import type { CompanyId, ConnectionId, PersonId, ProjectId } from '@conexus/hub-api'
import { CALL_DEADLINE_MS } from '@conexus/hub-api'
import { z } from 'zod'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { GrantedConnection, ShapedRead, Spent } from './builder-port.ts'
import { createSpending, described, offeredIn } from './builder-port.ts'
import { shaped } from './cut.ts'
import { readOf } from './grants.ts'
import { Notes } from './notes.ts'
import { readThrough } from './read.ts'
import type { Deps } from './rows.ts'
import { scopeOf } from './rows.ts'
import { openedIn } from './testing.ts'

/** Where a conversation lives: it decides which connections it may choose (C21). */
type Place = { kind: 'COMPANY' } | { kind: 'PROJECT'; projectId: ProjectId }

/** A conversation's scope, read from its thread on each turn (U2); the role is checked on every call. */
export type SessionScope = {
  companyId: CompanyId
  personId: PersonId
  place: Place
  chosen: readonly ConnectionId[]
}

type AssistantConnection = {
  connectionId: ConnectionId
  connector: string
  name: string
  reads: readonly { operation: string; summary: string }[]
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
    call: { connectionId: ConnectionId; turn: TurnKey; operation: string; input: unknown },
  ): Promise<AssistantRead>
  /** The connection's caderno, read only, under the same check as read. */
  notes(scope: SessionScope, connectionId: ConnectionId): Promise<Notes | null>
}

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
async function mayAsk(deps: Deps, tx: ReadTx, scope: SessionScope) {
  try {
    await deps.identity.admitMember({
      tx,
      personId: scope.personId,
      companyId: scope.companyId,
      action: 'askAssistant',
    })
    return true
  } catch (error) {
    if (!(error instanceof Failure) || error.code !== 'NOT_FOUND') throw error
    const reason = String(error.details.reason ?? 'NOT_FOUND')
    const { companyId, personId } = scope
    deps.log.info({ companyId, personId, reason }, 'ASSISTANT_NOT_ADMITTED')
    return false
  }
}

/** What the conversation's place offers to a person who may ask now, whether chosen or not, in one short transaction. */
function offered(deps: Deps, scope: SessionScope) {
  return deps.database.read(scopeOf(viewerOf(scope)), async (tx) =>
    (await mayAsk(deps, tx, scope)) ? offeredIn(tx, idsOf(scope)) : [],
  )
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
  use: (tx: ReadTx, row: { notes: unknown }) => Promise<T>,
): Promise<{ kind: 'OK'; value: T } | { kind: Refusal }> {
  if (!scope.chosen.includes(connectionId)) return { kind: 'NOT_CHOSEN' }
  return deps.database.read(scopeOf(viewerOf(scope)), async (tx) => {
    if (!(await mayAsk(deps, tx, scope))) return { kind: 'NOT_ADMITTED' }
    const [row] = await offeredIn(tx, idsOf(scope), connectionId)
    return row === undefined ? { kind: 'NOT_OFFERED' } : { kind: 'OK', value: await use(tx, row) }
  })
}

/** A refusal of the Assistant's read or notebook, its reason in the log (S10: the model hears NOT_GRANTED). */
function refused(
  deps: Deps,
  scope: SessionScope,
  about: { connectionId: ConnectionId; operation?: string; reason: Refusal },
) {
  const { companyId, personId } = scope
  deps.log.info({ companyId, personId, ...about }, 'ASSISTANT_READ_REFUSED')
  return { kind: 'NOT_GRANTED' } as const
}

function viewerOf(scope: SessionScope) {
  return { person: { id: scope.personId }, companyId: scope.companyId }
}

/** The company's door for the Assistant (step 24.1, U1): the chosen connections its place offers, read only, `by: 'assistant'`. */
export function createAssistantConnectors(deps: Deps): AssistantConnectors {
  const spend = createSpending()
  return {
    async connections(scope) {
      const chosen = new Set(scope.chosen)
      return described(await offered(deps, scope)).map(
        ({ connectionId, connector, name, reads, skill }) => ({
          connectionId,
          connector,
          name,
          reads,
          skill,
          chosen: chosen.has(connectionId),
        }),
      )
    },

    async read(scope, call) {
      const { connectionId } = call
      const found = await readable(deps, scope, connectionId, (tx) =>
        openedIn(deps, tx, { companyId: scope.companyId, connectionId }),
      )
      if (found.kind !== 'OK') return refused(deps, scope, { connectionId, reason: found.kind })
      const open = found.value
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
        opened: open,
        operation,
        input: call.input,
        deadlineMs: CALL_DEADLINE_MS,
      })
      return answered.kind === 'OK'
        ? { kind: 'OK', ...shaped(answered.value), whole: answered.value }
        : answered
    },

    async notes(scope, connectionId) {
      const found = await readable(deps, scope, connectionId, async (_, row) =>
        Notes.parse(row.notes),
      )
      if (found.kind === 'OK') return found.value
      refused(deps, scope, { connectionId, reason: found.kind })
      return null
    },
  }
}
