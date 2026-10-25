import type { ConversationId } from '@conexus/hub-api'
import { Effort, ModelId, Task } from '@conexus/hub-api'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import type { Builder } from './builder.ts'
import { memoryOwner } from './builder.ts'

type Owner = Parameters<typeof memoryOwner>[0]

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

/** The task list as Mastra's storage holds it for the thread: what `task_check` reads. */
async function tasksOf(builder: Builder, conversationId: ConversationId) {
  const store = await builder.mastra.getStorage()?.getStore('threadState')
  const tasks = await store?.getState({ threadId: conversationId, type: TASK_STATE_TYPE })
  return z.array(Task).catch([]).parse(tasks)
}

/**
 * A conversation as the person reads it beside its transcript: its title, model, effort and task
 * list, from Mastra's memory for the person's own resource, or `undefined` when Mastra holds no
 * thread for it. Its messages are Mastra's own route (`threads/:threadId/messages`, `guard.ts`). A
 * thread with no model is a defect of its creation (`createConversation` puts it on one).
 */
export async function historyOf(builder: Builder, owner: Owner, conversationId: ConversationId) {
  const resourceId = memoryOwner(owner)
  const thread = await builder.memory.getThreadById({ threadId: conversationId, resourceId })
  if (thread === null) return undefined
  const metadata = metadataOf(thread)
  const model = metadata.currentModelId
  if (model === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'CONVERSATION_MODEL_MISSING' } })
  }
  const effort = metadata.thinkingLevel ?? 'off'
  const tasks = await tasksOf(builder, conversationId)
  return { title: thread.title || null, model, effort, tasks }
}
