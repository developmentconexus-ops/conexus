import type { Answered, Native, NeedsReauth, Operation } from '@conexus/connectors'
import { CONCURRENT_CALL } from '@conexus/connectors'
import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { ConnectorId, OperationId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { z } from 'zod'
import type { Consumer } from '../access/public.ts'
import type { Speaker } from '../identity/public.ts'
import { roleOfSpeaker } from '../identity/public.ts'
import type { OpenedConnection } from './executor.ts'
import { bearerOf } from './executor.ts'
import type { Deps, Viewer } from './rows.ts'
import { scopeOf } from './rows.ts'
import { connection } from './tables.ts'
import type { TokenFailure } from './tokens.ts'
import { sessionFor } from './tokens.ts'

export type ReadRequest = Readonly<{
  /** The consumer that asked, the app of a click, or a copy's run, which the Registro does not record. */
  by: Consumer | 'app' | 'copy'
  /** The Projeto only where the reader works in one: the Assistant at the Início has none. */
  ids: Readonly<{ companyId: CompanyId; projectId?: ProjectId }>
  viewer: Viewer
  /** Who asks, held to the role or to what the version declares: a path that forgets it does not compile. */
  speaker: Speaker
  opened: OpenedConnection
  operation: Operation<unknown, unknown, 'read'>
  input: unknown
  deadlineMs: number
  /** The reader's turn stopped: a read still in the connection's line leaves it, and one not begun is not made. */
  signal?: AbortSignal
  /** The conversation that asked, when the caller has it. */
  thread?: ConversationId
}>

/** The speaker's role (or version) does not hold the operation: the model hears the role's name and never the input (S40). */
export type NotInRole = Readonly<{ kind: 'NOT_IN_ROLE'; role: string | null; operation: string }>

/**
 * What a read answers: the provider's refusal whole, as it came. Each consumer cuts at its own
 * edge: the app keeps the status, code and message (`app-calls.ts`), the model gets it all.
 */
export type ReadAnswer =
  | Readonly<{ kind: 'OK'; value: unknown; empty?: true }>
  | Readonly<{ kind: 'REFUSED' | 'AUTH_REFUSED' | 'UNREADABLE'; native: Native }>
  | Readonly<{ kind: 'BUSY'; waitMs: number | null }>
  | Readonly<{ kind: 'UNREACHABLE' | 'DEADLINE' }>

function answerOf(answered: Answered<unknown> | TokenFailure | NeedsReauth): ReadAnswer {
  switch (answered.kind) {
    case 'OK':
      return answered.empty === true
        ? { kind: 'OK', value: answered.value, empty: true }
        : { kind: 'OK', value: answered.value }
    case 'REFUSED':
    case 'AUTH_REFUSED':
    case 'UNREADABLE':
      return { kind: answered.kind, native: answered.native }
    case 'TOKEN_EXPIRED':
    case 'NEEDS_REAUTH':
      return { kind: 'AUTH_REFUSED', native: answered.native }
    case 'BUSY':
      return { kind: 'BUSY', waitMs: answered.waitMs }
    case 'UNREACHABLE':
    case 'APP_REFUSED':
      // The installation's own app was refused: the company can do nothing, and the app sees the provider unreachable.
      return { kind: 'UNREACHABLE' }
    default:
      return answered satisfies never
  }
}

const ISSUES_MAX = 1000

/** The schema's refusal as the caller can act on it: each path with the schema's message, no value. */
export function issuesOf(error: z.ZodError): string {
  const each = error.issues.map((issue) => `${issue.path.join('.') || '(input)'}: ${issue.message}`)
  return each.join('; ').slice(0, ISSUES_MAX)
}

/** The key the provider refused is the company's to connect again: the next call is NOT_GRANTED until they do. */
function needsReauth(deps: Deps, a: ReadRequest) {
  return deps.database.command(scopeOf(a.viewer), (tx) =>
    tx
      .update(connection)
      .set({ state: 'NEEDS_REAUTH' })
      .where(
        and(
          eq(connection.id, a.opened.id),
          eq(connection.companyId, a.ids.companyId),
          sql`${connection.linkedAt} = ${a.opened.linkedAt}::timestamptz`,
        ),
      ),
  )
}

/** The Projeto of the line, only where the reader works in one: a log field is a scalar, never `undefined`. */
function projectOf(ids: ReadRequest['ids']): Record<string, string> {
  return ids.projectId === undefined ? {} : { projectId: ids.projectId }
}

function once(deps: Deps, a: ReadRequest, input: unknown, endsAt: number) {
  function left() {
    return Math.max(1, Math.floor(endsAt - performance.now()))
  }
  return sessionFor(deps, a.viewer, a.opened).call(
    (token) => deps.executor.call(a.opened, bearerOf(token), a.operation, input, left()),
    AbortSignal.timeout(left()),
  )
}

function isStopped(a: ReadRequest): boolean {
  return a.signal?.aborted === true
}

/** A read the reader stopped before it reached the provider: no call was made, so no `CONNECTOR_CALLED` line. */
function stopped(deps: Deps, a: ReadRequest): ReadAnswer {
  deps.log.info(
    { connectionId: a.opened.id, operation: a.operation.id, by: a.by },
    'CONNECTOR_READ_STOPPED',
  )
  return { kind: 'DEADLINE' }
}

/** The line a live read leaves before its answer returns; a copy's run leaves none, and without the line the value does not return. */
async function recorded(
  deps: Deps,
  a: ReadRequest,
  answer: ReadAnswer | NotInRole,
  ms: number,
): Promise<ReadAnswer | NotInRole> {
  if (a.by === 'copy') return answer
  const written = await deps.recordRead({
    ...{ companyId: a.ids.companyId, personId: a.viewer.person.id, by: a.by },
    ...{ projectId: a.ids.projectId ?? null, agentId: null, threadId: a.thread ?? null },
    ...{ verb: 'LIVE', tables: [], query: null, rows: null },
    ...{ connectionId: a.opened.id, operation: OperationId.parse(a.operation.id) },
    ...{ outcome: answer.kind, ms: Math.round(ms) },
  })
  return written === 'RECORDED' ? answer : { kind: 'UNREACHABLE' }
}

/** The kit's schema refused the input: nothing reaches the provider, and the refusal leaves its line like the role's does. */
function invalidInput(deps: Deps, a: ReadRequest, error: z.ZodError, entered: number) {
  deps.log.info(
    { connectionId: a.opened.id, operation: a.operation.id, by: a.by, reason: 'INPUT_INVALID' },
    'CONNECTOR_INPUT_REFUSED',
  )
  const refusal: ReadAnswer = {
    kind: 'REFUSED',
    native: { status: 400, code: 'INPUT_INVALID', message: issuesOf(error), body: null },
  }
  return recorded(deps, a, refusal, performance.now() - entered)
}

/**
 * One read of a provider for the app, the Builder or the Assistant (at a Projeto or at the Início): the connection's turn, the token, the call, one
 * repeat on a token the provider ended. No database connection is held meanwhile (D22). Each call leaves one
 * `CONNECTOR_CALLED` line with scalars alone, and the envelope "4" (ours, never repeated) its own
 * error line (#470).
 */
export async function readThrough(deps: Deps, a: ReadRequest): Promise<ReadAnswer | NotInRole> {
  if (isStopped(a)) return stopped(deps, a)
  const entered = performance.now()
  const allowed = await deps.identity.mayUse(a.ids.companyId, a.speaker, {
    connectionId: a.opened.id,
    connectorId: ConnectorId.parse(a.opened.connector.id),
    operationId: OperationId.parse(a.operation.id),
  })
  if (!allowed) {
    const role = roleOfSpeaker(a.speaker)
    deps.log.info(
      {
        ...{ connectionId: a.opened.id, operation: a.operation.id, by: a.by },
        ...(role === null ? {} : { role }),
      },
      'CONNECTOR_READ_REFUSED',
    )
    return recorded(
      deps,
      a,
      { kind: 'NOT_IN_ROLE', role, operation: a.operation.id },
      performance.now() - entered,
    )
  }
  const started = performance.now()
  const parsed = a.operation.input.safeParse(a.input)
  // The kit's own schema judges what the caller wrote: nothing reaches the provider when it refuses,
  // and the caller is told each field the schema refused, by path and the schema's words.
  if (!parsed.success) return invalidInput(deps, a, parsed.error, entered)
  let queuedMs = a.deadlineMs
  const turn = await deps.limits.inTurn(
    a.opened.id,
    a.deadlineMs,
    (waitedMs) => {
      queuedMs = Math.round(waitedMs)
      return once(deps, a, parsed.data, performance.now() + a.deadlineMs - waitedMs)
    },
    a.signal,
  )
  const answered = 'kind' in turn && turn.kind === 'DEADLINE' ? null : turn
  if (answered === null && isStopped(a)) return stopped(deps, a)
  const result: ReadAnswer = answered === null ? { kind: 'DEADLINE' } : answerOf(answered)
  if (answered?.kind === 'UNREADABLE' && answered.native.code === CONCURRENT_CALL)
    deps.log.error(
      { connectionId: a.opened.id, connector: a.opened.connector.id },
      'CONNECTOR_CONCURRENCY_FAULT',
    )
  if (result.kind === 'AUTH_REFUSED') await needsReauth(deps, a)
  const ms = Math.round(performance.now() - started)
  deps.log.info(
    {
      companyId: a.ids.companyId,
      ...projectOf(a.ids),
      personId: a.viewer.person.id,
      connectionId: a.opened.id,
      connector: a.opened.connector.id,
      operation: a.operation.id,
      by: a.by,
      result: result.kind,
      ms,
      queuedMs,
      bytes: result.kind === 'OK' ? Buffer.byteLength(JSON.stringify(result.value) ?? '') : 0,
    },
    'CONNECTOR_CALLED',
  )
  return recorded(deps, a, result, performance.now() - entered)
}
