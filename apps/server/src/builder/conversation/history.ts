import type { Message } from '@conexus/hub-api'
import { z } from 'zod'
import type { Builder } from './builder.ts'
import { memoryOwner } from './builder.ts'
import { messageOf } from './parts.ts'
import type { Owner } from './sessions.ts'
import { QUESTION_KEY } from './sessions.ts'

const Question = z.object({ content: z.string(), at: z.iso.datetime() })
const Metadata = z.object({ currentModelId: z.string().optional() }).loose()

/** The titles of a page of the person's threads, read from Mastra by each id (at most a page). */
export async function titlesOf(builder: Builder, owner: Owner, ids: string[]) {
  const resourceId = memoryOwner(owner)
  const threads = await Promise.all(
    ids.map((threadId) => builder.memory.getThreadById({ threadId, resourceId })),
  )
  return new Map(ids.map((id, index) => [id, threads[index]?.title || null]))
}

/**
 * A conversation as the person reads it: its title, model and messages, from Mastra's memory for
 * the person's own resource. A question kept on the thread that Mastra has not saved yet (its turn
 * runs, or the process stopped in it) is shown after them, so it is not lost.
 */
export async function historyOf(builder: Builder, owner: Owner, conversationId: string) {
  const resourceId = memoryOwner(owner)
  const thread = await builder.memory.getThreadById({ threadId: conversationId, resourceId })
  const recalled =
    thread === null
      ? { messages: [] }
      : await builder.memory.recall({ threadId: conversationId, resourceId, perPage: false })
  const messages: Message[] = recalled.messages.flatMap((message) => messageOf(message) ?? [])
  const metadata = Metadata.parse(thread?.metadata ?? {})
  const kept = Question.safeParse(metadata[QUESTION_KEY])
  const asked = kept.success ? kept.data : undefined
  const saved = messages.some(
    (message) => message.role === 'person' && asked !== undefined && message.createdAt >= asked.at,
  )
  if (asked !== undefined && !saved) {
    const { content, at } = asked
    messages.push({
      id: `question-${at}`,
      role: 'person',
      parts: [{ type: 'text', text: content }],
      createdAt: at,
    })
  }
  return { title: thread?.title || null, model: metadata.currentModelId ?? '', messages }
}
