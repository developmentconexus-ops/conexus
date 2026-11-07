import { createHash } from 'node:crypto'
import type { Answered, Native } from '@conexus/connectors'
import type {
  AgentId,
  ConnectionId,
  ConversationId,
  OperationId,
  PersonId,
  ToolCallId,
} from '@conexus/hub-api'
import { and, eq, inArray, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Scalar } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { Speaker } from '../identity/public.ts'
import type { Deps } from './rows.ts'
import { scopeOf } from './rows.ts'
import type { SessionScope, TurnKey } from './scope.ts'
import { connectorWrite } from './tables.ts'

type Person = Extract<Speaker, { kind: 'PERSON' }>
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

/** The failures a stored answer may hold: the provider's words without its body (S41), never an `OK` of another write. */
const Plain = z.object({
  status: z.number(),
  code: z.string().nullable(),
  message: z.string().nullable(),
  body: z.null(),
})
const Stored = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('OK'), value: z.unknown() }),
  z.object({
    kind: z.enum(['REFUSED', 'AUTH_REFUSED', 'TOKEN_EXPIRED', 'UNREADABLE']),
    native: Plain,
  }),
  z.object({ kind: z.literal('BUSY'), native: Plain, waitMs: z.number().nullable() }),
  z.object({ kind: z.enum(['UNREACHABLE', 'DEADLINE']) }),
])

export function plain(native: Native): z.infer<typeof Plain> {
  return { status: native.status, code: native.code, message: native.message, body: null }
}

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

/**
 * The record of the send, committed before the provider is called, so a process that dies between
 * leaves a `SENDING` row and no repeat sends again. The key (company, conversation, call) lets one
 * insert in; the other reads the row (a `SENDING` one is an uncertain write now).
 */
export async function register(
  deps: Deps,
  a: WriteRequest,
  put: Readonly<{ hash: string; mark: string; connector: string }>,
): Promise<Registered> {
  const author = authorOf(a)
  const viewer = { person: { id: a.scope.personId }, companyId: a.scope.companyId }
  return deps.database.command(scopeOf(viewer), async (tx) => {
    const inserted = await tx
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
        state: 'SENDING',
        createdAt: sql`statement_timestamp()`,
      })
      .onConflictDoNothing()
      .returning({ state: connectorWrite.state })
    if (inserted.length > 0) return { kind: 'OWNED' }
    const [row] = await tx
      .select({
        state: connectorWrite.state,
        inputHash: connectorWrite.inputHash,
        answer: connectorWrite.answer,
      })
      .from(connectorWrite)
      .where(key(a))
    if (row === undefined) throw new Failure('INTERNAL_UNEXPECTED')
    if (row.state === 'SENDING')
      await tx
        .update(connectorWrite)
        .set({ state: 'UNCERTAIN' })
        .where(and(key(a), eq(connectorWrite.state, 'SENDING')))
    const written = foundIn(row, put.hash, put.mark)
    deps.log.info(
      { ...aboutOf(a, put.connector), state: row.state, sameInput: row.inputHash === put.hash },
      'CONNECTOR_WRITE_REPEATED',
    )
    return { kind: 'FOUND', written }
  })
}

/** An earlier write of the conversation whose end the record does not know. */
export type OpenWrite = Readonly<{ state: 'SENDING' | 'UNCERTAIN'; since: Date; mark: string }>

/**
 * The writes of this conversation, connection and operation that may exist in the provider: rows still
 * `SENDING` or `UNCERTAIN` under another call. The key's own call is left out, for `register` answers it.
 */
export async function openWritesOf(deps: Deps, a: WriteRequest): Promise<readonly OpenWrite[]> {
  const viewer = { person: { id: a.scope.personId }, companyId: a.scope.companyId }
  const rows = await deps.database.read(scopeOf(viewer), (tx) =>
    tx
      .select({
        toolCallId: connectorWrite.toolCallId,
        state: connectorWrite.state,
        createdAt: connectorWrite.createdAt,
      })
      .from(connectorWrite)
      .where(
        and(
          eq(connectorWrite.companyId, a.scope.companyId),
          eq(connectorWrite.threadId, a.threadId),
          eq(connectorWrite.connectionId, a.connectionId),
          eq(connectorWrite.operationId, a.operation),
          ne(connectorWrite.toolCallId, a.toolCallId),
          inArray(connectorWrite.state, ['SENDING', 'UNCERTAIN']),
        ),
      )
      .orderBy(connectorWrite.createdAt),
  )
  return rows.flatMap((row) =>
    row.state === 'SENDING' || row.state === 'UNCERTAIN'
      ? [{ state: row.state, since: row.createdAt, mark: markOf(a.threadId, row.toolCallId) }]
      : [],
  )
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
