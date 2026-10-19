import type { ConversationId, Message } from '@conexus/hub-api'
import { ModelId } from '@conexus/hub-api'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import type { Builder } from './builder.ts'
import { memoryOwner } from './builder.ts'
import type { Owner } from './live.ts'
import { QUESTION_KEY, Question } from './live.ts'
import { messageOf } from './parts.ts'

// What the thread keeps beside its messages: Mastra's model, and Conexus's questions.
const Metadata = z
  .object({
    currentModelId: ModelId.optional(),
    [QUESTION_KEY]: z.array(Question).default([]),
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
function unsaved(kept: Question[], messages: Message[]): Message[] {
  return kept
    .filter(
      (asked) =>
        !messages.some((message) => message.role === 'person' && message.createdAt >= asked.at),
    )
    .map((asked) => ({
      id: asked.key,
      role: 'person',
      parts: [{ type: 'text', text: asked.content }],
      createdAt: asked.at,
    }))
}

/**
 * A conversation as the person reads it: its title, model and messages, from Mastra's memory for
 * the person's own resource, or `undefined` when Mastra holds no thread for it. The questions kept
 * on the thread that Mastra has not saved yet (their run is in progress, or the process stopped in
 * it) come after them, by the key they were sent with, so none is lost. A thread with no model is
 * a defect of its creation (`createConversation` puts it on one).
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
  const recalled = await builder.memory.recall({
    threadId: conversationId,
    resourceId,
    perPage: false,
  })
  const messages = recalled.messages.flatMap((message) => messageOf(message) ?? [])
  const asked = unsaved(metadata[QUESTION_KEY], messages)
  return { title: thread.title || null, model, messages: [...messages, ...asked] }
}
