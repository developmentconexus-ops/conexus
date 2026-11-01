import type { ConnectorAnswer } from '@conexus/app-contract'
import type { Answered, Native, Operation } from '@conexus/connectors'
import { CONCURRENT_CALL } from '@conexus/connectors'
import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { Login, OpenedConnection } from './executor.ts'
import type { Deps, Viewer } from './rows.ts'
import { scopeOf } from './rows.ts'
import { connection } from './tables.ts'
import type { AppRefused } from './tokens.ts'
import { accessFor } from './tokens.ts'

/** Who asked for the read: the app of a click, the Builder's tool, or the Assistant's. */
type ReadBy = 'app' | 'builder' | 'assistant'

export type ReadRequest = Readonly<{
  by: ReadBy
  /** The Projeto only where the reader works in one: the Assistant at the Início has none. */
  ids: Readonly<{ companyId: CompanyId; projectId?: ProjectId }>
  viewer: Viewer
  opened: OpenedConnection
  operation: Operation<unknown, unknown, 'read'>
  input: unknown
  deadlineMs: number
}>

/** What of the provider's answer an app may see: never its body (S41). */
function summaryOf(native: Native) {
  return { status: native.status, code: native.code, message: native.message }
}

function answerOf(
  answered: Answered<unknown> | Exclude<Login, { kind: 'TOKEN' }> | AppRefused,
): ConnectorAnswer {
  switch (answered.kind) {
    case 'OK':
      return answered.empty === true
        ? { kind: 'OK', value: answered.value, empty: true }
        : { kind: 'OK', value: answered.value }
    case 'REFUSED':
    case 'AUTH_REFUSED':
    case 'UNREADABLE':
      return { kind: answered.kind, native: summaryOf(answered.native) }
    case 'TOKEN_EXPIRED':
      return { kind: 'AUTH_REFUSED', native: summaryOf(answered.native) }
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

/** The Projeto of the line, only where the reader works in one. */
function projectOf(ids: ReadRequest['ids']): Record<string, string> {
  return ids.projectId === undefined ? {} : { projectId: ids.projectId }
}

/** A token, the read, and when the provider ended the token, one new token and one repeat; the deadline is one for all. */
async function once(deps: Deps, a: ReadRequest, input: unknown, endsAt: number) {
  const access = accessFor(deps, a.viewer)
  function left() {
    return Math.max(1, Math.floor(endsAt - performance.now()))
  }
  const first = await access.token(a.opened, { force: false, deadlineMs: left() })
  if (first.kind !== 'TOKEN') return first
  const sent = await deps.executor.call(a.opened, first.token, a.operation, input, left())
  if (sent.kind !== 'TOKEN_EXPIRED') return sent
  const again = await access.token(a.opened, {
    force: true,
    refused: sent.native,
    deadlineMs: left(),
  })
  if (again.kind !== 'TOKEN') return again
  return deps.executor.call(a.opened, again.token, a.operation, input, left())
}

/**
 * One read of a provider for the app or the Builder: the connection's turn, the token, the call, one
 * repeat on a token the provider ended. No database connection is held meanwhile (D22). Each call
 * leaves one `CONNECTOR_CALLED` line with scalars alone, and the envelope "4" (ours, never repeated)
 * its own error line (#470).
 */
export async function readThrough(deps: Deps, a: ReadRequest): Promise<ConnectorAnswer> {
  const started = performance.now()
  const parsed = a.operation.input.safeParse(a.input)
  // The kit's own schema judges what the app wrote: nothing reaches the provider when it refuses.
  if (!parsed.success)
    return { kind: 'REFUSED', native: { status: 400, code: 'INPUT_INVALID', message: null } }
  let queuedMs = a.deadlineMs
  const turn = await deps.limits.inTurn(a.opened.id, a.deadlineMs, (waitedMs) => {
    queuedMs = Math.round(waitedMs)
    return once(deps, a, parsed.data, performance.now() + a.deadlineMs - waitedMs)
  })
  const answered = 'kind' in turn && turn.kind === 'DEADLINE' ? null : turn
  const result: ConnectorAnswer = answered === null ? { kind: 'DEADLINE' } : answerOf(answered)
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
  return result
}
