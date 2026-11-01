import type { CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import { CALL_DEADLINE_MS, ConnectionId } from '@conexus/hub-api'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import type { ReadTx } from '../../platform/database.ts'
import type { GrantedConnection, ShapedRead, Spent } from './builder-port.ts'
import { createSpending, described, grantedIn } from './builder-port.ts'
import { shaped } from './cut.ts'
import { readOf } from './grants.ts'
import { Notes } from './notes.ts'
import { readThrough } from './read.ts'
import type { Deps } from './rows.ts'
import { admitted, scopeOf } from './rows.ts'
import { connection } from './tables.ts'
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
  /** What the place offers (company: ACTIVE; Projeto: ACTIVE and granted), each with chosen; [] for a person who may not ask. */
  connections(scope: SessionScope): Promise<readonly AssistantConnection[]>
  /** One read of a chosen, offered connection, read class only. */
  read(
    scope: SessionScope,
    call: { connectionId: ConnectionId; turn: TurnKey; operation: string; input: unknown },
  ): Promise<AssistantRead>
  /** The connection's caderno, read only, under the same check as read. */
  notes(scope: SessionScope, connectionId: ConnectionId): Promise<Notes | null>
}

/** The company's ACTIVE connections: the Início offers all of them, no Projeto's grant in between. */
function companyIn(tx: ReadTx, companyId: CompanyId, connectionId?: ConnectionId) {
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
        eq(connection.companyId, companyId),
        eq(connection.state, 'ACTIVE'),
        connectionId === undefined ? undefined : eq(connection.id, connectionId),
      ),
    )
    .orderBy(asc(connection.connectorId), asc(connection.linkedAt))
}

/**
 * What the conversation's place offers to a person who may ask now (their role, read on every call,
 * S10), whether chosen or not: the owner of "what a conversation may read" (C26). The list, the
 * notebook and every read go through it, in one short transaction.
 */
function offered(deps: Deps, scope: SessionScope, connectionId?: ConnectionId) {
  const viewer = { person: { id: scope.personId }, companyId: scope.companyId }
  return deps.database.read(scopeOf(viewer), async (tx) => {
    const member = await admitted(deps, tx, viewer, 'readConnections')
    if (!deps.identity.allows(member.role, 'askAssistant')) return []
    return scope.place.kind === 'PROJECT'
      ? grantedIn(
          tx,
          { companyId: scope.companyId, projectId: scope.place.projectId },
          connectionId,
        )
      : companyIn(tx, scope.companyId, connectionId)
  })
}

/** The one connection the conversation chose and its place offers; none gives NOT_GRANTED or a null notebook whatever the reason (S10). */
async function readable(deps: Deps, scope: SessionScope, connectionId: ConnectionId) {
  if (!scope.chosen.includes(connectionId)) return undefined
  const [row] = await offered(deps, scope, connectionId)
  return row
}

/** The ids of the line: the Projeto only where the conversation lives in one. */
function idsOf(scope: SessionScope) {
  return scope.place.kind === 'PROJECT'
    ? { companyId: scope.companyId, projectId: scope.place.projectId }
    : { companyId: scope.companyId }
}

/** The connection opened by a short read; the provider is called after it ends (D22). */
function opened(deps: Deps, scope: SessionScope, id: string) {
  const viewer = { person: { id: scope.personId }, companyId: scope.companyId }
  return deps.database.read(scopeOf(viewer), (tx) =>
    openedIn(deps, tx, { companyId: scope.companyId, connectionId: ConnectionId.parse(id) }),
  )
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
      const found = await readable(deps, scope, call.connectionId)
      if (found === undefined) return { kind: 'NOT_GRANTED' }
      const open = await opened(deps, scope, found.id)
      const operation = readOf(open.connector, call.operation)
      if (operation === undefined) return { kind: 'NOT_GRANTED' }
      if (!spend(call.turn)) return { kind: 'CALLS_SPENT' }
      const answered = await readThrough(deps, {
        by: 'assistant',
        ids: idsOf(scope),
        viewer: { person: { id: scope.personId }, companyId: scope.companyId },
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
      const found = await readable(deps, scope, connectionId)
      return found === undefined ? null : Notes.parse(found.notes)
    },
  }
}
