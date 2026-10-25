import type { ConversationId } from '@conexus/hub-api'
import { ModelId } from '@conexus/hub-api'
import type { Builder } from './builder.ts'
import { memoryOwner } from './builder.ts'

type Owner = Parameters<typeof memoryOwner>[0]

/** The titles of a page of the person's threads, read from Mastra by each id (at most a page). */
export async function titlesOf(builder: Builder, owner: Owner, ids: ConversationId[]) {
  const resourceId = memoryOwner(owner)
  const threads = await Promise.all(
    ids.map((threadId) => builder.memory.getThreadById({ threadId, resourceId })),
  )
  return new Map(ids.map((id, index) => [id, threads[index]?.title || null]))
}

/** The model the conversation's thread is on (`session.model.switch`), or none yet. */
export async function threadModel(builder: Builder, owner: Owner, conversationId: ConversationId) {
  const resourceId = memoryOwner(owner)
  const thread = await builder.memory.getThreadById({ threadId: conversationId, resourceId })
  return ModelId.optional().parse(thread?.metadata?.currentModelId)
}

/**
 * The conversation's title from Mastra's memory for the person's own resource, or `undefined` when
 * Mastra holds no thread for it. Its model, effort and tasks are Mastra's session-state route, and
 * its messages the transcript route (`guard.ts`).
 */
export async function titleOf(builder: Builder, owner: Owner, conversationId: ConversationId) {
  const resourceId = memoryOwner(owner)
  const thread = await builder.memory.getThreadById({ threadId: conversationId, resourceId })
  return thread === null ? undefined : thread.title || null
}
