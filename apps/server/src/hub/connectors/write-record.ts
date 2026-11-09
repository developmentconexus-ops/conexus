import type { AgentId, ConnectionId, OperationId, PersonId, WorkflowId } from '@conexus/hub-api'
import {
  BalloonCallKey,
  ConnectionId as ConnectionIdSchema,
  Native,
  OperationId as OperationIdSchema,
  ToolCallId,
} from '@conexus/hub-api'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { transactionLock } from '../../platform/database.ts'
import type { Scalar } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { Deps } from './rows.ts'
import { scopeOf } from './rows.ts'
import type { SessionScope, WriteScope } from './scope.ts'
import { connectorWrite } from './tables.ts'
import type { RunWrite, WriteRequest, Written } from './write-request.ts'
import { isRun, markOf, scopeIdOf } from './write-request.ts'

const Stored = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('OK'), value: z.unknown() }),
  z.object({
    kind: z.enum(['REFUSED', 'AUTH_REFUSED', 'TOKEN_EXPIRED', 'UNREADABLE']),
    native: Native,
  }),
  z.object({ kind: z.literal('BUSY'), native: Native, waitMs: z.number().nullable() }),
  z.object({ kind: z.enum(['UNREACHABLE', 'DEADLINE']) }),
])

type Author =
  | Readonly<{ kind: 'VERSION'; agentId: AgentId; number: number }>
  | Readonly<{ kind: 'PERSON'; personId: PersonId }>
  | Readonly<{ kind: 'WORKFLOW'; workflowId: WorkflowId; number: number }>

function authorOf(a: WriteRequest): Author {
  if ('agentId' in a) return { kind: 'VERSION', agentId: a.agentId, number: a.number }
  if ('workflowId' in a) return { kind: 'WORKFLOW', workflowId: a.workflowId, number: a.number }
  return { kind: 'PERSON', personId: a.speaker.personId }
}

/** What every line about this write says: scalars, never a field of the input (S40). */
export function aboutOf(a: WriteRequest, connector?: string): Record<string, Scalar> {
  const author = authorOf(a)
  return {
    companyId: a.scope.companyId,
    connectionId: a.connectionId,
    ...(connector === undefined ? {} : { connector }),
    operation: a.operation,
    toolCallId: a.callKey,
    ...(author.kind === 'PERSON' ? { personId: author.personId } : {}),
    ...(author.kind === 'VERSION' ? { agentId: author.agentId, versionNumber: author.number } : {}),
    ...(author.kind === 'WORKFLOW'
      ? { workflowId: author.workflowId, versionNumber: author.number }
      : {}),
  }
}

type Registered = Readonly<{ kind: 'OWNED' }> | Readonly<{ kind: 'FOUND'; written: Written }>

type Row = Readonly<{
  state: 'SENDING' | 'DONE' | 'REFUSED' | 'UNCERTAIN'
  inputHash: string
  answer: unknown
}>

/** What the record says of a write already registered: the same input gets the answer back, another input is a conflict of the key. */
function foundIn(row: Row, hash: string, mark: string): Written {
  if (row.inputHash !== hash) return { kind: 'IDEMPOTENCY_CONFLICT', mark }
  if (row.state === 'SENDING' || row.state === 'UNCERTAIN') return { kind: 'WRITE_UNCERTAIN', mark }
  return Stored.parse(row.answer)
}

function key(a: WriteRequest, callKey: string = a.callKey) {
  return and(
    eq(connectorWrite.companyId, a.scope.companyId),
    eq(connectorWrite.threadId, scopeIdOf(a.where)),
    eq(connectorWrite.toolCallId, callKey),
  )
}

/** The call's own row: a repeat of the call reads it and is never sent. */
async function ownRow(tx: ReadTx, a: WriteRequest): Promise<Row | undefined> {
  const [row] = await tx
    .select({
      state: connectorWrite.state,
      inputHash: connectorWrite.inputHash,
      answer: connectorWrite.answer,
    })
    .from(connectorWrite)
    .where(key(a))
  return row
}

type Put = Readonly<{ hash: string; mark: string; connector: string }>

/** The row of a call about to send, `SENDING`; false when a row of the same key already holds it. */
async function inserted(tx: CommandTx, a: WriteRequest, put: Put): Promise<boolean> {
  const author = authorOf(a)
  const rows = await tx
    .insert(connectorWrite)
    .values({
      companyId: a.scope.companyId,
      threadId: scopeIdOf(a.where),
      toolCallId: a.callKey,
      connectionId: a.connectionId,
      operationId: a.operation,
      inputHash: put.hash,
      agentId: author.kind === 'VERSION' ? author.agentId : null,
      versionNumber: author.kind === 'VERSION' ? author.number : null,
      personId: author.kind === 'PERSON' ? author.personId : null,
      workflowId: author.kind === 'WORKFLOW' ? author.workflowId : null,
      workflowVersion: author.kind === 'WORKFLOW' ? author.number : null,
      approvedBy: a.approvedBy ?? null,
      state: 'SENDING',
      createdAt: sql`statement_timestamp()`,
    })
    .onConflictDoNothing()
    .returning({ state: connectorWrite.state })
  return rows.length > 0
}

/** What a call answers from a row of the record: never sent again, and a `SENDING` row is an uncertain write now. By default the call's own row; `earlier` is another attempt's. */
async function found(
  deps: Deps,
  tx: CommandTx,
  a: WriteRequest,
  put: Put,
  row: Row,
  earlier?: Readonly<{ callKey: BalloonCallKey; mark: string }>,
) {
  const callKey = earlier?.callKey ?? a.callKey
  if (row.state === 'SENDING')
    await tx
      .update(connectorWrite)
      .set({ state: 'UNCERTAIN' })
      .where(and(key(a, callKey), eq(connectorWrite.state, 'SENDING')))
  deps.log.info(
    { ...aboutOf(a, put.connector), state: row.state, sameInput: row.inputHash === put.hash },
    'CONNECTOR_WRITE_REPEATED',
  )
  return { kind: 'FOUND', written: foundIn(row, put.hash, earlier?.mark ?? put.mark) } as const
}

/**
 * The rows of the same balloon in earlier attempts of the run, newest first: only for a balloon's own
 * write (its call key has no tool call), and read by prefix, never `LIKE` (the `_` of `b7_0.b3` is a wildcard there).
 */
async function earlierRows(tx: ReadTx, a: RunWrite) {
  const [address, , ...rest] = a.callKey.split('#')
  if (address === undefined || rest.length > 0) return []
  return tx
    .select({
      toolCallId: connectorWrite.toolCallId,
      state: connectorWrite.state,
      inputHash: connectorWrite.inputHash,
      answer: connectorWrite.answer,
    })
    .from(connectorWrite)
    .where(
      and(
        eq(connectorWrite.companyId, a.scope.companyId),
        eq(connectorWrite.threadId, a.where.runId),
        sql`starts_with(${connectorWrite.toolCallId}, ${`${address}#`})`,
        sql`${connectorWrite.toolCallId} <> ${a.callKey}`,
      ),
    )
    .orderBy(desc(connectorWrite.createdAt))
}

/**
 * What an earlier attempt of the same balloon already settled: the newest row that is not `REFUSED`
 * answers (a `DONE` with the same input gives its stored answer and never sends; another input is
 * `IDEMPOTENCY_CONFLICT`; a `SENDING` or `UNCERTAIN` one is `WRITE_UNCERTAIN` with its own mark,
 * unless a person who looked in the system approved this call). A `REFUSED` one, or none, lets this
 * attempt send.
 */
async function earlierAttempt(deps: Deps, tx: CommandTx, a: RunWrite, put: Put) {
  for (const row of await earlierRows(tx, a)) {
    if (row.state === 'REFUSED' || (row.state !== 'DONE' && a.approvedBy !== undefined)) continue
    const callKey = BalloonCallKey.parse(row.toolCallId)
    return found(deps, tx, a, put, row, { callKey, mark: markOf(a.where.runId, callKey) })
  }
  return undefined
}

/** The refusal of a call while an earlier write of its kind may exist; none when a person approved this very call (the write tool sets `approvedBy` from the approval Mastra resumed with). */
async function heldBy(deps: Deps, tx: CommandTx, a: WriteRequest, put: Put) {
  if (a.approvedBy !== undefined) return undefined
  const [open] = await openRows(tx, {
    ...{ scope: a.scope, where: a.where, connectionId: a.connectionId, operation: a.operation },
  })
  if (open === undefined) return undefined
  deps.log.info(
    { ...aboutOf(a, put.connector), openMark: open.mark, openState: open.state },
    'CONNECTOR_WRITE_OPEN',
  )
  return {
    kind: 'FOUND',
    written: { kind: 'WRITE_OPEN', mark: open.mark, since: open.since },
  } as const
}

/**
 * The record of the send, committed before the provider is called, so a process that dies between
 * leaves a `SENDING` row and no repeat sends again. One short transaction, locked on the company,
 * conversation or run, connection and operation (code C65), so two calls of the same write take
 * turns: the call's own row answers first, then an earlier attempt of the same balloon, then an open
 * write of another call refuses unless a person approved, and only then the row is inserted.
 */
export async function register(deps: Deps, a: WriteRequest, put: Put): Promise<Registered> {
  const viewer = { person: { id: a.scope.personId }, companyId: a.scope.companyId }
  return deps.database.command(scopeOf(viewer), async (tx) => {
    await transactionLock(
      tx,
      `conexus.connector-write:${a.scope.companyId}:${scopeIdOf(a.where)}:${a.connectionId}:${a.operation}`,
    )
    const own = await ownRow(tx, a)
    if (own !== undefined) return found(deps, tx, a, put, own)
    const earlier = isRun(a) ? await earlierAttempt(deps, tx, a, put) : undefined
    if (earlier !== undefined) return earlier
    const held = await heldBy(deps, tx, a, put)
    if (held !== undefined) return held
    if (await inserted(tx, a, put)) return { kind: 'OWNED' }
    // The key without the lock's connection or operation: another call under it got in first, and its row answers.
    const raced = await ownRow(tx, a)
    if (raced === undefined) throw new Failure('INTERNAL_UNEXPECTED')
    return found(deps, tx, a, put, raced)
  })
}

/** An earlier write of the conversation whose end the record does not know: what the card's notice says of it, never its fields (S40). */
export type OpenWrite = Readonly<{
  connectionId: ConnectionId
  operation: OperationId
  state: 'SENDING' | 'UNCERTAIN'
  since: Date
  mark: string
}>

const OpenState = z.enum(['SENDING', 'UNCERTAIN'])

/** Which open writes: the conversation's or the run's, of one connection and operation when named. */
export type OpenWritesKey = Readonly<{
  scope: SessionScope
  where: WriteScope
  connectionId?: ConnectionId
  operation?: OperationId
}>

/**
 * The writes of the conversation or run that may exist in the provider: rows still `SENDING` or
 * `UNCERTAIN`, of one connection and operation when the key names them.
 */
async function openRows(tx: ReadTx, key: OpenWritesKey): Promise<readonly OpenWrite[]> {
  const rows = await tx
    .select({
      callKey: connectorWrite.toolCallId,
      connectionId: connectorWrite.connectionId,
      operation: connectorWrite.operationId,
      state: connectorWrite.state,
      createdAt: connectorWrite.createdAt,
    })
    .from(connectorWrite)
    .where(
      and(
        eq(connectorWrite.companyId, key.scope.companyId),
        eq(connectorWrite.threadId, scopeIdOf(key.where)),
        key.connectionId === undefined
          ? undefined
          : eq(connectorWrite.connectionId, key.connectionId),
        key.operation === undefined ? undefined : eq(connectorWrite.operationId, key.operation),
        inArray(connectorWrite.state, ['SENDING', 'UNCERTAIN']),
      ),
    )
    .orderBy(connectorWrite.createdAt)
  return rows.map((row) => ({
    connectionId: ConnectionIdSchema.parse(row.connectionId),
    operation: OperationIdSchema.parse(row.operation),
    state: OpenState.parse(row.state),
    since: row.createdAt,
    mark: markOf(scopeIdOf(key.where), callKeyOf(key.where, row.callKey)),
  }))
}

/** The conversation's open writes, read on their own (step 24.5): what a write's rule and the card's notice read. */
export function openWritesOf(deps: Deps, key: OpenWritesKey): Promise<readonly OpenWrite[]> {
  const viewer = { person: { id: key.scope.personId }, companyId: key.scope.companyId }
  return deps.database.read(scopeOf(viewer), (tx) => openRows(tx, key))
}

/** The call key a row holds, parsed by what the scope's calls are named. */
function callKeyOf(where: WriteScope, raw: string): ToolCallId | BalloonCallKey {
  return where.kind === 'RUN' ? BalloonCallKey.parse(raw) : ToolCallId.parse(raw)
}

/** What the system said of a refused write, as stored; none for any other end. */
export function refusedMessageOf(row: Pick<Row, 'state' | 'answer'>): string | null {
  if (row.state !== 'REFUSED') return null
  const stored = Stored.parse(row.answer)
  return 'native' in stored ? stored.native.message : null
}

const STATES = { OK: 'DONE', WRITE_UNCERTAIN: 'UNCERTAIN' } as const

/** The record's end; if the database refuses it the model still hears what the provider answered, and the process says the row stayed `SENDING`. */
export async function finish(
  deps: Deps,
  a: WriteRequest,
  written: Written,
  connector: string,
): Promise<void> {
  const viewer = { person: { id: a.scope.personId }, companyId: a.scope.companyId }
  const state =
    written.kind === 'OK' || written.kind === 'WRITE_UNCERTAIN' ? STATES[written.kind] : 'REFUSED'
  try {
    await deps.database.command(scopeOf(viewer), (tx) =>
      tx
        .update(connectorWrite)
        .set({ state, answer: written.kind === 'WRITE_UNCERTAIN' ? null : written })
        .where(key(a)),
    )
  } catch (error) {
    if (!(error instanceof Failure)) throw error
    deps.log.error({ ...aboutOf(a, connector), code: error.code }, 'CONNECTOR_WRITE_UNRECORDED')
  }
}
