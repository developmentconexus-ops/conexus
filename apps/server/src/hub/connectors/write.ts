import type { WriteOperation } from '@conexus/connectors'
import { connectorOf } from '@conexus/connectors'
import { ConnectorId, OperationId } from '@conexus/hub-api'
import type { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import { roleOfSpeaker } from '../identity/public.ts'
import { offeredIn } from './builder-port.ts'
import type { Login, OpenedConnection } from './executor.ts'
import { issuesOf } from './read.ts'
import type { Deps } from './rows.ts'
import { scopeOf } from './rows.ts'
import { idsOf } from './scope.ts'
import { openedIn } from './testing.ts'
import type { AppRefused } from './tokens.ts'
import { accessFor } from './tokens.ts'
import type { WriteRequest, Written } from './write-record.ts'
import { aboutOf, finish, hashOf, markOf, plain, register } from './write-record.ts'
import type { Wrote } from './wrote.ts'

/** The text the model reads for `WRITE_UNCERTAIN` and for `IDEMPOTENCY_CONFLICT`: the one place that says what to do with them. */
export function uncertainText(mark: string): string {
  return `Do not call this again: the write may already exist. Tell the person to look for the mark "${mark}" in what the system wrote.`
}

/** The text the model reads for `WRITE_OPEN`: an earlier write of this kind in the conversation may exist, so this one was not sent. */
export function openText(mark: string, since: Date): string {
  return `Do not call this again: a write like it, asked at ${since.toISOString()}, may already exist and this one was not sent. Tell the person to look for the mark "${mark}" in what the system wrote before anything is written again.`
}

type Ended = Wrote<unknown> | Exclude<Login, { kind: 'TOKEN' }> | AppRefused | { kind: 'DEADLINE' }

/** What an ended call is for the model and for the record: a send whose end is unknown is `WRITE_UNCERTAIN`, the rest of the failures were not taken. */
function writtenOf(ended: Ended, mark: string): Written {
  switch (ended.kind) {
    case 'OK':
      return { kind: 'OK', value: ended.value }
    case 'UNCERTAIN':
      return { kind: 'WRITE_UNCERTAIN', mark }
    case 'REFUSED':
    case 'AUTH_REFUSED':
    case 'TOKEN_EXPIRED':
    case 'UNREADABLE':
      return { kind: ended.kind, native: plain(ended.native) }
    case 'BUSY':
      return { kind: 'BUSY', native: plain(ended.native), waitMs: ended.waitMs }
    case 'UNREACHABLE':
    case 'APP_REFUSED':
      return { kind: 'UNREACHABLE' }
    case 'DEADLINE':
      return ended
    default:
      return ended satisfies never
  }
}

type Admitted =
  | Readonly<{
      kind: 'ADMITTED'
      opened: OpenedConnection
      operation: WriteOperation<unknown, unknown>
    }>
  | Readonly<{ kind: 'NOT_IN_ROLE' | 'NOT_GRANTED' }>

/**
 * The connection the conversation chose and the Projeto offers, opened, and the write the connector
 * declares, in one short read; then the role's answer, read now, never kept. A refusal's reason is
 * in the log only: the model hears the kind (S10).
 */
async function admitted(deps: Deps, a: WriteRequest): Promise<Admitted> {
  const { scope } = a
  function refused(kind: 'NOT_IN_ROLE' | 'NOT_GRANTED', reason: string, role?: string | null) {
    deps.log.info(
      { ...aboutOf(a), reason, ...(role == null ? {} : { role }) },
      'CONNECTOR_WRITE_REFUSED',
    )
    return { kind }
  }
  if (!scope.chosen.includes(a.connectionId)) return refused('NOT_GRANTED', 'NOT_CHOSEN')
  const viewer = { person: { id: scope.personId }, companyId: scope.companyId }
  const found = await deps.database.read(scopeOf(viewer), async (tx) => {
    const role = await deps.identity.roleOf(tx, scope.companyId, scope.personId)
    const [row] = await offeredIn(tx, idsOf(scope), a.connectionId)
    return role === undefined || row === undefined
      ? undefined
      : {
          role,
          connector: row.connector,
          opened: await openedIn(deps, tx, {
            companyId: scope.companyId,
            connectionId: a.connectionId,
          }),
        }
  })
  if (found === undefined) return refused('NOT_GRANTED', 'NOT_OFFERED')
  const operation = connectorOf(found.connector)?.writes?.find((each) => each.id === a.operation)
  // The tool is built from the version's declared writes: an id that is no write is the caller's mistake.
  if (operation === undefined) throw new Failure('REQUEST_MALFORMED')
  const speaker = a.speaker.kind === 'PERSON' ? { ...a.speaker, role: found.role } : a.speaker
  const allowed = await deps.identity.mayUse(scope.companyId, speaker, {
    connectionId: a.connectionId,
    connectorId: ConnectorId.parse(found.connector),
    operationId: OperationId.parse(a.operation),
  })
  if (!allowed) return refused('NOT_IN_ROLE', 'NOT_IN_ROLE', roleOfSpeaker(speaker))
  return { kind: 'ADMITTED', opened: found.opened, operation }
}

/** A token, then the one send, in the connection's turn; every step before the send that fails is a failure where nothing left. */
async function sendOnce(
  deps: Deps,
  a: WriteRequest,
  admit: Extract<Admitted, { kind: 'ADMITTED' }>,
  input: unknown,
  endsAt: number,
): Promise<Ended> {
  const { opened, operation } = admit
  const viewer = { person: { id: a.scope.personId }, companyId: a.scope.companyId }
  function left() {
    return Math.max(1, Math.floor(endsAt - performance.now()))
  }
  const login = await accessFor(deps, viewer).token(opened, { force: false, deadlineMs: left() })
  if (login.kind !== 'TOKEN') return login
  const sent = await deps.executor.write(opened, login.token, operation, input, left())
  // The provider ended the token before it took the request: never repeated, but the next call logs in again.
  if (sent.kind === 'TOKEN_EXPIRED') deps.limits.invalidate(opened, login.token)
  return sent
}

/** The line for what came of the send, before the record's end: scalars only, and the id the write declares when the answer has one (S40). */
function logSent(
  deps: Deps,
  a: WriteRequest,
  connector: string,
  operation: WriteOperation<unknown, unknown>,
  written: Written,
): void {
  const about = aboutOf(a, connector)
  if (written.kind === 'OK') {
    const id = operation.idOf(written.value)
    deps.log.info(
      { ...about, ...(id === null ? {} : { codigoPedido: id }) },
      'CONNECTOR_WRITE_SENT',
    )
  } else if (written.kind === 'WRITE_UNCERTAIN') {
    deps.log.info(about, 'CONNECTOR_WRITE_UNCERTAIN')
  } else {
    deps.log.info({ ...about, result: written.kind }, 'CONNECTOR_WRITE_REFUSED')
  }
}

/**
 * One write of a provider for an agent (card 24.5, U1), the twin of `readThrough` with the same
 * `mayUse`: the role and the release first, then the record committed with `SENDING`, then the one
 * send with the mark in the observation, then the record's end. A write is never sent twice: a call
 * the record already holds answers from it. No database connection is held while the provider
 * answers (D22).
 */
export async function writeThrough(deps: Deps, a: WriteRequest): Promise<Written> {
  const admit = await admitted(deps, a)
  if (admit.kind !== 'ADMITTED') return admit
  const { opened, operation } = admit
  const connector = opened.connector.id
  const parsed = operation.input.safeParse(a.input)
  const mark = markOf(a.threadId, a.toolCallId)
  const checked = parsed.success
    ? operation.input.safeParse(operation.mark(parsed.data, mark))
    : parsed
  // The kit's own schema judges what was written, and the mark must still fit the field: nothing is registered or sent when it refuses.
  if (!checked.success) {
    deps.log.info({ ...aboutOf(a, connector), reason: 'INPUT_INVALID' }, 'CONNECTOR_INPUT_REFUSED')
    const message = parsed.success ? roomLeft(checked.error, mark) : issuesOf(checked.error)
    return { kind: 'REFUSED', native: { status: 400, code: 'INPUT_INVALID', message, body: null } }
  }
  const registered = await register(deps, a, { hash: hashOf(parsed.data), mark, connector })
  if (registered.kind === 'FOUND') return registered.written
  const turn = await deps.limits.inTurn(
    opened.id,
    deps.callDeadlineMs,
    (waitedMs) =>
      sendOnce(deps, a, admit, checked.data, performance.now() + deps.callDeadlineMs - waitedMs),
    a.signal,
  )
  const written = writtenOf(turn, mark)
  logSent(deps, a, connector, operation, written)
  await finish(deps, a, written, connector)
  return written
}

/** The refusal of a text that fit alone and no longer fits with the mark: each field's room once the mark is added, never the schema's bare limit. */
function roomLeft(error: z.ZodError, mark: string): string {
  return error.issues
    .map((issue) => {
      const field = issue.path.join('.') || '(input)'
      return issue.code === 'too_big' && typeof issue.maximum === 'number'
        ? `${field}: at most ${issue.maximum - mark.length - 1} characters, because "${mark}" is added at the end`
        : `${field}: ${issue.message}`
    })
    .join('; ')
}
