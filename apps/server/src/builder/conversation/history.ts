import type { ConversationId, Message, MessageId, OMProgress } from '@conexus/hub-api'
import { Effort, ModelId, Task } from '@conexus/hub-api'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import type { Builder } from './builder.ts'
import { memoryOwner } from './builder.ts'
import type { Owner } from './live.ts'
import { wireMessage } from './wire.ts'

// What the thread keeps beside its messages: Mastra's model and effort.
const Metadata = z
  .object({ currentModelId: ModelId.optional(), thinkingLevel: Effort.optional() })
  .loose()

/** The type Mastra's thread-state store keeps a thread's task list under (`task-tools.ts`). */
const TASK_STATE_TYPE = 'task'

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

/**
 * The Builder's messages of one turn as one: Mastra saves a message per step, and a turn that
 * called tools has several, and the message of ours that a turn keeps follows them. The turn's
 * model is the last one's.
 */
function turnsOf(messages: Message[]): Message[] {
  const turns: Message[] = []
  for (const message of messages) {
    const last = turns.at(-1)
    if (last?.role === 'builder' && message.role === 'builder') {
      turns[turns.length - 1] = {
        ...last,
        parts: [...last.parts, ...message.parts],
        suspended: { ...last.suspended, ...message.suspended },
        model: message.model ?? last.model,
      }
    } else turns.push(message)
  }
  return turns
}

/** The messages up to the one `id`, or all of them when it is not saved yet. */
function untilMessage(messages: Message[], id: MessageId): Message[] {
  const at = messages.findIndex((message) => message.id === id)
  return at === -1 ? messages : messages.slice(0, at + 1)
}

/** The task list as Mastra's storage holds it for the thread: what `task_check` reads. */
async function tasksOf(builder: Builder, conversationId: ConversationId) {
  const store = await builder.mastra.getStorage()?.getStore('threadState')
  const tasks = await store?.getState({ threadId: conversationId, type: TASK_STATE_TYPE })
  return z.array(Task).catch([]).parse(tasks)
}

/**
 * A conversation as the person reads it: its title, model, messages, tasks and memory, from Mastra's
 * memory for the person's own resource, or `undefined` when Mastra holds no thread for it. The
 * messages are Mastra's own, as it saved them (the person's question before the turn, and the
 * message of ours that each turn keeps), cut as the stream cuts them. A thread with no model is a
 * defect of its creation (`createConversation` puts it on one). A turn in progress is left out after
 * the message it answers: the stream tells it whole, and a read that held both would show it twice.
 * `memory` is the session's progress when this process has the conversation open, else `null`.
 */
export async function historyOf(
  builder: Builder,
  owner: Owner,
  conversationId: ConversationId,
  open: { inProgress?: MessageId; memory: OMProgress | null },
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
  const messages = turnsOf(recalled.messages.flatMap((message) => wireMessage(message) ?? []))
  const { inProgress } = open
  const read = inProgress === undefined ? messages : untilMessage(messages, inProgress)
  const effort = metadata.thinkingLevel ?? 'off'
  const tasks = await tasksOf(builder, conversationId)
  return {
    ...{ title: thread.title || null, model, effort, messages: read, tasks },
    ...{ memory: open.memory, inProgress: inProgress !== undefined },
  }
}
