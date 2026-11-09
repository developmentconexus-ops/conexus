import { createHash } from 'node:crypto'
import type { Answered } from '@conexus/connectors'
import type {
  AgentId,
  BalloonCallKey,
  ConnectionId,
  ConversationId,
  OperationId,
  PersonId,
  ToolCallId,
  WorkflowId,
  WorkflowRunId,
} from '@conexus/hub-api'
import type { Speaker } from '../identity/public.ts'
import type { SessionScope, TurnKey, WriteScope } from './scope.ts'

/** A person talking to a draft; the funnel reads their role on every call, so the request carries none. */
type Person = Readonly<{ kind: 'PERSON'; personId: PersonId }>
type Version = Extract<Speaker, { kind: 'VERSION' }>
type WorkflowSpeaker = Extract<Speaker, { kind: 'WORKFLOW' }>

/** Where a write is kept and the name of the call in it: with `where` it names the write, so a repeat of the call is found, never sent. */
export type WriteKey =
  | Readonly<{ where: Extract<WriteScope, { kind: 'CONVERSATION' }>; callKey: ToolCallId }>
  | Readonly<{ where: Extract<WriteScope, { kind: 'RUN' }>; callKey: BalloonCallKey }>

/**
 * One write an agent or a workflow asks for, once per conversation or run and call. A published
 * version speaks by what it declares and is named by `agentId` or `workflowId` and `number` (a
 * version has no id of its own); a person talking to a draft, which has no version, speaks by their
 * role. The role is read again on every call.
 */
export type WriteRequest = Readonly<{
  scope: SessionScope
  connectionId: ConnectionId
  operation: OperationId
  input: unknown
  /** Set only by the approval gate of the next unit: the person who saw an earlier open write and lets this one be sent. */
  approvedBy?: PersonId
  turn: TurnKey
  signal?: AbortSignal
}> &
  WriteKey &
  (
    | Readonly<{ speaker: Person }>
    | Readonly<{ speaker: Version; agentId: AgentId; number: number }>
    | Readonly<{ speaker: WorkflowSpeaker; workflowId: WorkflowId; number: number }>
  )

export type RunWrite = WriteRequest & { where: { kind: 'RUN' } }

export function isRun(a: WriteRequest): a is RunWrite {
  return a.where.kind === 'RUN'
}

/** The id the record keeps the write under: the conversation or the run. */
export function scopeIdOf(where: WriteScope): ConversationId | WorkflowRunId {
  return where.kind === 'RUN' ? where.runId : where.threadId
}

/**
 * What the model and the screen are told of a write. `WRITE_UNCERTAIN` means the request may have
 * reached the provider and the Hub does not know: it is never sent again, and `mark` is what the person
 * looks for in the provider. `IDEMPOTENCY_CONFLICT` is another input under a key already used (code C37),
 * and `WRITE_OPEN` is a write asked under a new call while an earlier one of the same conversation or run,
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

/** The one owner of the mark an order carries in its observation, so the person can find it: "Conexus " and 8 characters of a hash of the conversation or run and the call. */
export function markOf(
  scopeId: ConversationId | WorkflowRunId,
  callKey: ToolCallId | BalloonCallKey,
): string {
  const hash = createHash('sha256').update(`${scopeId}\n${callKey}`).digest('hex')
  return `Conexus ${hash.slice(0, MARK_HASH_LENGTH)}`
}

export function hashOf(input: unknown): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex')
}
