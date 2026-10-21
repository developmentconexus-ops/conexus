import type { ConversationId, Message, MessageId, MessagePart } from '@conexus/hub-api'
import { applyEvent, Effort, ModelId } from '@conexus/hub-api'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import type { Builder } from './builder.ts'
import { memoryOwner } from './builder.ts'
import {
  QUESTION_KEY,
  Question,
  questionId,
  THINKING_KEY,
  ThoughtTime,
  TURN_FAILURES_KEY,
  TURN_PARTS_KEY,
  TurnFailure,
  TurnPart,
} from './kept.ts'
import type { Owner } from './live.ts'
import { eventOf, messageOf } from './parts.ts'

// What the thread keeps beside its messages: Mastra's model and effort, Conexus's questions,
// failures, thinking times and the turns' lasting parts.
const Metadata = z
  .object({
    currentModelId: ModelId.optional(),
    thinkingLevel: Effort.optional(),
    [QUESTION_KEY]: z.array(Question).default([]),
    [TURN_FAILURES_KEY]: z.array(TurnFailure).default([]),
    [THINKING_KEY]: z.array(ThoughtTime).default([]),
    [TURN_PARTS_KEY]: z.array(TurnPart).default([]),
  })
  .loose()

/** The titles of a page of the person's threads, read from Mastra by each id (at most a page). */
export async function titlesOf(builder: Builder, owner: Owner, ids: ConversationId[]) {
  const resourceId = memoryOwner(owner)
  const threads = await Promise.all(
    ids.map((threadId) => builder.memory.getThreadById({ threadId, resourceId })),
  )
  return new Map(ids.map((id, index) => [id, threads[index]?.title || null]))
}

function metadataOf(thread: { metadata?: unknown }) {
  return Metadata.parse(thread.metadata ?? {})
}

/** The model the conversation's thread is on (`session.model.switch`), or none yet. */
export async function threadModel(builder: Builder, owner: Owner, conversationId: ConversationId) {
  const resourceId = memoryOwner(owner)
  const thread = await builder.memory.getThreadById({ threadId: conversationId, resourceId })
  return thread === null ? undefined : metadataOf(thread).currentModelId
}

/** The questions kept on the thread that no saved message of the person's came after. */
function unsavedQuestions(kept: Question[], messages: Message[]): Question[] {
  return kept.filter(
    (asked) =>
      !messages.some((message) => message.role === 'person' && message.createdAt >= asked.at),
  )
}

function unsaved(conversationId: ConversationId, kept: Question[], messages: Message[]): Message[] {
  return unsavedQuestions(kept, messages).map((asked) => ({
    id: questionId(conversationId, asked.key),
    role: 'person',
    parts: [{ type: 'text', text: asked.content }],
    model: null,
    createdAt: asked.at,
  }))
}

/**
 * The Builder's messages of one turn as one, folded as the stream told it: Mastra saves a message
 * per step, and a turn that called tools has several. The turn's model is the last one's.
 */
function turnsOf(messages: Message[]): Message[] {
  const turns: Message[] = []
  for (const message of messages) {
    const last = turns.at(-1)
    if (last?.role === 'builder' && message.role === 'builder') {
      turns[turns.length - 1] = {
        ...last,
        parts: message.parts.map(eventOf).reduce(applyEvent, last.parts),
        model: message.model ?? last.model,
      }
    } else turns.push(message)
  }
  return turns
}

/**
 * Each failure at the end of the Builder's turn after its message. Mastra saves a failed turn too,
 * just after its end, so a read that comes before it shows the failure with it once it does.
 */
function withFailures(messages: Message[], failures: TurnFailure[]): Message[] {
  const shown = [...messages]
  for (const { after, code } of failures) {
    const at = shown.findIndex((message) => message.id === after) + 1
    const turn = shown[at]
    if (at === 0 || turn?.role !== 'builder') continue
    shown[at] = { ...turn, parts: [...turn.parts, { type: 'failure', code }] }
  }
  return shown
}

/**
 * Each turn's lasting parts in the Builder's turn after its message, where the stream said them: a
 * replaced machine after the tool that started it, the version at the end.
 */
function withKept(messages: Message[], kept: TurnPart[]): Message[] {
  const shown = [...messages]
  for (const { after, part } of kept) {
    const at = shown.findIndex((message) => message.id === after) + 1
    const turn = shown[at]
    if (at === 0 || turn?.role !== 'builder') continue
    const tool = turn.parts.findIndex((each) => each.type === 'tool') + 1
    const place = part.type === 'machine' ? tool : turn.parts.length
    shown[at] = { ...turn, parts: turn.parts.toSpliced(place, 0, part) }
  }
  return shown
}

/** Each thinking with the seconds the stream said it took, or `null` where none was kept. */
function withSeconds(messages: Message[], times: ThoughtTime[]): Message[] {
  const seconds = new Map(times.map((time) => [time.id, time.seconds]))
  function timed(part: MessagePart): MessagePart {
    return part.type === 'reasoning' ? { ...part, seconds: seconds.get(part.id) ?? null } : part
  }
  return messages.map((message) => ({ ...message, parts: message.parts.map(timed) }))
}

/** The messages up to the one `id`, or all of them when it is not saved yet. */
function untilMessage(messages: Message[], id: MessageId): Message[] {
  const at = messages.findIndex((message) => message.id === id)
  return at === -1 ? messages : messages.slice(0, at + 1)
}

/**
 * A conversation as the person reads it: its title, model and messages, from Mastra's memory for
 * the person's own resource, or `undefined` when Mastra holds no thread for it. The questions kept
 * on the thread that Mastra has not saved yet (their run is in progress, or the process stopped in
 * it) come after them, by the key they were sent with, so none is lost. A thread with no model is
 * a defect of its creation (`createConversation` puts it on one). Each turn's failure is read back
 * where it happened. A turn in progress is left out after the message it answers: the stream tells
 * it whole, with what Mastra has saved of it so far, and a read that held both would show it twice.
 * Each thinking shows the seconds the stream said, and each turn its lasting parts, as kept on the
 * thread.
 */
export async function historyOf(
  builder: Builder,
  owner: Owner,
  conversationId: ConversationId,
  inProgress?: MessageId,
) {
  const resourceId = memoryOwner(owner)
  const thread = await builder.memory.getThreadById({ threadId: conversationId, resourceId })
  if (thread === null) return undefined
  const metadata = metadataOf(thread)
  const model = metadata.currentModelId
  if (model === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'CONVERSATION_MODEL_MISSING' } })
  }
  const recalled = await builder.memory.recall({
    threadId: conversationId,
    resourceId,
    perPage: false,
  })
  const messages = turnsOf(recalled.messages.flatMap((message) => messageOf(message) ?? []))
  const asked = unsaved(conversationId, metadata[QUESTION_KEY], messages)
  const settled = inProgress === undefined ? messages : untilMessage(messages, inProgress)
  const timed = withSeconds(settled, metadata[THINKING_KEY])
  const lasting = withKept(timed, metadata[TURN_PARTS_KEY])
  const read = withFailures([...lasting, ...asked], metadata[TURN_FAILURES_KEY])
  const effort = metadata.thinkingLevel ?? 'off'
  return { title: thread.title || null, model, effort, messages: read }
}
