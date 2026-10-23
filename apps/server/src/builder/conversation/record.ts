import type { ConversationId, MastraPart, RunId } from '@conexus/hub-api'
import { MessageId } from '@conexus/hub-api'
import type { MastraDBMessage } from '@mastra/core/agent-controller'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Builder } from './builder.ts'
import { memoryOwner } from './builder.ts'
import type { TurnLog } from './turn-log.ts'

/** A question of the person, named by its message's Idempotency-Key. */
export type Question = { key: string; content: string; at: string }

/**
 * The id of the person's message sent with `key`, made by the server: Mastra saves the message
 * under it, so the question saved before the turn and the one the turn saves are one.
 */
export function questionId(conversationId: ConversationId, key: string): MessageId {
  return MessageId.parse(`${conversationId}:${key}`)
}

/** What writing to a conversation's thread needs: the memory, the owner, the log and the writes in flight. */
export type Recorder = {
  memory: Builder['memory']
  owner: Parameters<typeof memoryOwner>[0]
  conversationId: ConversationId
  log: FailureLog
  kept: Promise<void>
}

/** A write to the thread after the ones before it, which the next write waits for in turn. */
function queued(recorder: Pick<Recorder, 'kept'>, write: () => Promise<void>): Promise<void> {
  // biome-ignore lint/plugin: a write that failed went to its own caller; this one only waits for the queue to settle (code C37)
  const kept = recorder.kept.catch(() => undefined).then(write)
  recorder.kept = kept
  return kept
}

function messageOf(
  recorder: Recorder,
  input: { id: MessageId; role: 'user' | 'assistant'; at: Date; parts: MastraPart[] },
): MastraDBMessage {
  const { id, role, at, parts } = input
  return {
    id,
    role,
    createdAt: at,
    threadId: recorder.conversationId,
    resourceId: memoryOwner(recorder.owner),
    content: { format: 2, parts },
  }
}

/**
 * Saves the person's question on the thread before the turn starts (Mastra saves a run's messages
 * only at its end, `savePerStep: false`), under the id the turn's signal carries, so a crash loses
 * none and the turn's own save is the same row (card, criterion 30). A refused write refuses the
 * send, before Mastra wakes (nothing to undo).
 */
export function saveQuestion(recorder: Recorder, question: Question): Promise<void> {
  const parts: MastraPart[] = [{ type: 'text', text: question.content }]
  const id = questionId(recorder.conversationId, question.key)
  const message = messageOf(recorder, { id, role: 'user', at: new Date(question.at), parts })
  return queued(recorder, async () => {
    await recorder.memory.saveMessages({ messages: [message] })
  })
}

/** Waits for every write queued so far; one that failed is logged, for its own caller has gone on. */
export function settled(recorder: Recorder): Promise<void> {
  return recorder.kept.catch((cause: unknown) =>
    logFailure(recorder.log, new Failure('INTERNAL_UNEXPECTED', { cause })),
  )
}

/** Whether a part of ours stays on the thread: a thinking's time, the version, the failure, the restart, a machine replaced. */
function lasts(part: MastraPart): boolean {
  if (part.type === 'data-conexus-machine') {
    const { data } = part
    return typeof data === 'object' && data !== null && 'phase' in data && data.phase === 'replaced'
  }
  return (
    part.type === 'data-conexus-thought' ||
    part.type === 'data-conexus-version' ||
    part.type === 'data-conexus-failure' ||
    part.type === 'data-conexus-restarted'
  )
}

/**
 * Keeps the parts of ours that last past the turn, as one message of the Builder named by the turn,
 * after the ones Mastra saves for it. Saved again as more come, under the same id and time. A write
 * that fails is logged and the turn goes on without it.
 */
export function saveExtras(recorder: Recorder, turn: TurnLog): Promise<void> {
  const parts = turn.extras.filter(lasts)
  if (parts.length === 0) return Promise.resolve()
  turn.extrasAt ??= new Date()
  const message = messageOf(recorder, {
    id: turn.answerId,
    role: 'assistant',
    at: turn.extrasAt,
    parts,
  })
  return queued(recorder, async () => {
    await recorder.memory.saveMessages({ messages: [message] })
  }).catch((cause: unknown) =>
    logFailure(recorder.log, new Failure('INTERNAL_UNEXPECTED', { cause })),
  )
}

/**
 * Keeps a restart's part on the thread, after the person's question the turn it ended answered: the
 * turn's own messages never reached Mastra's save, so the part stands alone (card, the restart).
 */
export function saveRestarted(
  recorder: Recorder,
  input: { runId: RunId; kept: unknown },
): Promise<void> {
  const part: MastraPart = { type: 'data-conexus-restarted', data: { kept: input.kept } }
  const id = MessageId.parse(input.runId)
  const message = messageOf(recorder, { id, role: 'assistant', at: new Date(), parts: [part] })
  return queued(recorder, async () => {
    await recorder.memory.saveMessages({ messages: [message] })
  })
}
