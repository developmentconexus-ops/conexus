import { createHash } from 'node:crypto'
import type { Answered } from '@conexus/connectors'
import type { AgentId, ConnectionId, ConversationId, OperationId, PersonId } from '@conexus/hub-api'
import {
  ConnectionId as ConnectionIdSchema,
  Native,
  OperationId as OperationIdSchema,
  ToolCallId,
} from '@conexus/hub-api'
import { and, eq, inArray, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { transactionLock } from '../../platform/database.ts'
import type { Scalar } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { Speaker } from '../identity/public.ts'
import type { Deps } from './rows.ts'
import { scopeOf } from './rows.ts'
import type { SessionScope, TurnKey } from './scope.ts'
import { connectorWrite } from './tables.ts'

/** A person talking to a draft; the funnel reads their role on every call, so the request carries none. */
type Person = Readonly<{ kind: 'PERSON'; personId: PersonId }>
type Version = Extract<Speaker, { kind: 'VERSION' }>

/**
 * One write an agent asks for, once per conversation and tool call. A published version speaks by what
 * it declares and is named by `agentId` and `number` (a version has no id of its own); a person talking to a draft, which has no version, speaks
 * by their role. The role is read again on every call.
 */
export type WriteRequest = Readonly<{
  scope: SessionScope
  connectionId: ConnectionId
  operation: OperationId
  input: unknown
  /** The conversation: with `toolCallId` it names the write, so a repeat of the call is found, never sent. */
  threadId: ConversationId
  toolCallId: ToolCallId
  /** Set only by the approval gate of the next unit: the person who saw an earlier open write and lets this one be sent. */
  approvedBy?: PersonId
  turn: TurnKey
  signal?: AbortSignal
}> &
  (Readonly<{ speaker: Person }> | Readonly<{ speaker: Version; agentId: AgentId; number: number }>)

/**
 * What the model and the screen are told of a write. `WRITE_UNCERTAIN` means the request may have
 * reached the provider and the Hub does not know: it is never sent again, and `mark` is what the person
 * looks for in the provider. `IDEMPOTENCY_CONFLICT` is another input under a key already used (code C37),
 * and `WRITE_OPEN` is a write asked under a new call while an earlier one of the same conversation,
 * connection and operation may still exist: `mark` and `since` name that earlier one. The kinds after
 * `OK` are the failures where nothing was sent.
 */
export type Written =
  | Readonly<{ kind: 'OK'; value: unknown }>
  | Readonly<{ kind: 'NOT_IN_ROLE' }>
  | Readonly<{ kind: 'NOT_GRANTED' }>
  | Readonly<{ kind: 'WRITE_UNCERTAIN'; mark: string }>
  | Readonly<{ kind: 'IDEMPOTENCY_CONFLICT'; mark: string }>
  | Readonly<{ kind: 'WRITE_OPEN'; mark: string; since: Date }>
  | Readonly<{ kind: 'UNREACHABLE' }>
  | Readonly<{ kind: 'DEADLINE' }>
  | Exclude<Answered<unknown>, { kind: 'OK' }>

const MARK_HASH_LENGTH = 8

/** The one owner of the mark an order carries in its observation, so the person can find it: "Conexus " and 8 characters of a hash of the conversation and the call. */
export function markOf(threadId: ConversationId, toolCallId: ToolCallId): string {
  const hash = createHash('sha256').update(`${threadId}\n${toolCallId}`).digest('hex')
  return `Conexus ${hash.slice(0, MARK_HASH_LENGTH)}`
}

export function hashOf(input: unknown): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex')
}

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

function authorOf(a: WriteRequest): Author {
  return 'agentId' in a
    ? { kind: 'VERSION', agentId: a.agentId, number: a.number }
    : { kind: 'PERSON', personId: a.speaker.personId }
}

/** What every line about this write says: scalars, never a field of the input (S40). */
export function aboutOf(a: WriteRequest, connector?: string): Record<string, Scalar> {
  const author = authorOf(a)
  return {
    companyId: a.scope.companyId,
    connectionId: a.connectionId,
    ...(connector === undefined ? {} : { connector }),
    operation: a.operation,
    toolCallId: a.toolCallId,
    ...(author.kind === 'VERSION'
      ? { agentId: author.agentId, versionNumber: author.number }
      : { personId: author.personId }),
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

function key(a: WriteRequest) {
  return and(
    eq(connectorWrite.companyId, a.scope.companyId),
    eq(connectorWrite.threadId, a.threadId),
    eq(connectorWrite.toolCallId, a.toolCallId),
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
      threadId: a.threadId,
      toolCallId: a.toolCallId,
      connectionId: a.connectionId,
      operationId: a.operation,
      inputHash: put.hash,
      agentId: author.kind === 'VERSION' ? author.agentId : null,
      versionNumber: author.kind === 'VERSION' ? author.number : null,
      personId: author.kind === 'PERSON' ? author.personId : null,
      approvedBy: a.approvedBy ?? null,
      state: 'SENDING',
      createdAt: sql`statement_timestamp()`,
    })
    .onConflictDoNothing()
    .returning({ state: connectorWrite.state })
  return rows.length > 0
}

/** What a call answers from its own row: never sent again, and a `SENDING` row is an uncertain write now. */
async function found(deps: Deps, tx: CommandTx, a: WriteRequest, put: Put, row: Row) {
  if (row.state === 'SENDING')
    await tx
      .update(connectorWrite)
      .set({ state: 'UNCERTAIN' })
      .where(and(key(a), eq(connectorWrite.state, 'SENDING')))
  deps.log.info(
    { ...aboutOf(a, put.connector), state: row.state, sameInput: row.inputHash === put.hash },
    'CONNECTOR_WRITE_REPEATED',
  )
  return { kind: 'FOUND', written: foundIn(row, put.hash, put.mark) } as const
}

/** The refusal of a call while an earlier write of its kind may exist; none when a person approved it (U2's gate sets `approvedBy`). */
async function heldBy(deps: Deps, tx: CommandTx, a: WriteRequest, put: Put) {
  if (a.approvedBy !== undefined) return undefined
  const [open] = await openRows(tx, {
    ...{ scope: a.scope, threadId: a.threadId, connectionId: a.connectionId },
    ...{ operation: a.operation, except: a.toolCallId },
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
 * conversation, connection and operation (code C65), so two calls of the same write take turns: the
 * call's own row answers first, then an open write of another call refuses unless a person approved,
 * and only then the row is inserted.
 */
export async function register(deps: Deps, a: WriteRequest, put: Put): Promise<Registered> {
  const viewer = { person: { id: a.scope.personId }, companyId: a.scope.companyId }
  return deps.database.command(scopeOf(viewer), async (tx) => {
    await transactionLock(
      tx,
      `conexus.connector-write:${a.scope.companyId}:${a.threadId}:${a.connectionId}:${a.operation}`,
    )
    const own = await ownRow(tx, a)
    if (own !== undefined) return found(deps, tx, a, put, own)
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

/** Which open writes: the conversation's, of one connection and operation when named, without the call `except` names. */
export type OpenWritesKey = Readonly<{
  scope: SessionScope
  threadId: ConversationId
  connectionId?: ConnectionId
  operation?: OperationId
  except?: ToolCallId
}>

/**
 * The writes of the conversation that may exist in the provider: rows still `SENDING` or `UNCERTAIN`,
 * of one connection and operation when the key names them, without the call `except` names.
 */
async function openRows(tx: ReadTx, key: OpenWritesKey): Promise<readonly OpenWrite[]> {
  const rows = await tx
    .select({
      toolCallId: connectorWrite.toolCallId,
      connectionId: connectorWrite.connectionId,
      operation: connectorWrite.operationId,
      state: connectorWrite.state,
      createdAt: connectorWrite.createdAt,
    })
    .from(connectorWrite)
    .where(
      and(
        eq(connectorWrite.companyId, key.scope.companyId),
        eq(connectorWrite.threadId, key.threadId),
        key.connectionId === undefined
          ? undefined
          : eq(connectorWrite.connectionId, key.connectionId),
        key.operation === undefined ? undefined : eq(connectorWrite.operationId, key.operation),
        key.except === undefined ? undefined : ne(connectorWrite.toolCallId, key.except),
        inArray(connectorWrite.state, ['SENDING', 'UNCERTAIN']),
      ),
    )
    .orderBy(connectorWrite.createdAt)
  return rows.map((row) => ({
    connectionId: ConnectionIdSchema.parse(row.connectionId),
    operation: OperationIdSchema.parse(row.operation),
    state: OpenState.parse(row.state),
    since: row.createdAt,
    mark: markOf(key.threadId, ToolCallId.parse(row.toolCallId)),
  }))
}

/** The conversation's open writes, read on their own (step 24.5): what a write's rule and the card's notice read. */
export function openWritesOf(deps: Deps, key: OpenWritesKey): Promise<readonly OpenWrite[]> {
  const viewer = { person: { id: key.scope.personId }, companyId: key.scope.companyId }
  return deps.database.read(scopeOf(viewer), (tx) => openRows(tx, key))
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
