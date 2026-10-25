import { ModelId } from '@conexus/hub-api'
import type { MastraMessagePart } from '@mastra/client-js'
import { z } from 'zod'

/** A call Mastra keeps waiting for the person, as its display state holds it. */
export type Suspended = {
  toolCallId: string
  toolName: string
  args: unknown
  suspendPayload: unknown
}

/** A message as the transcript draws it: the person's or the Builder's, with Mastra's parts. */
export type Message = {
  id: string
  role: 'person' | 'builder'
  parts: readonly MastraMessagePart[]
  /** The model that answered the Builder's message, as Mastra recorded it; `null` for the person. */
  model: ModelId | null
  createdAt: string
}

/** Mastra's message as the stream and the transcript route carry it, after JSON. */
export type Stored = {
  id: string
  role: string
  createdAt: string | Date
  content: { parts: readonly MastraMessagePart[]; metadata?: unknown }
}

const Answered = z.object({ modelId: z.string().min(1), provider: z.string().min(1) })
const PersonSignal = z.object({ signal: z.object({ type: z.literal('user') }) })
/** What Mastra's controller puts in the part of a message the person sent into the running run. */
const USER_MESSAGE_PART = 'data-user-message'
const UserMessageData = z.object({
  contents: z.union([
    z.string(),
    z.array(z.object({ type: z.string(), text: z.string().optional() })),
  ]),
})
function modelOf(metadata: unknown): ModelId | null {
  const answered = Answered.safeParse(metadata)
  if (!answered.success) return null
  return ModelId.safeParse(`${answered.data.provider}/${answered.data.modelId}`).data ?? null
}

/** The words a signal carries live, as a text part (Factory `withRenderableSignalText`). */
function userText(part: MastraMessagePart): MastraMessagePart {
  if (part.type !== USER_MESSAGE_PART || !('data' in part)) return part
  const read = UserMessageData.safeParse(part.data)
  if (!read.success) return part
  const { contents } = read.data
  const text =
    typeof contents === 'string'
      ? contents
      : contents.flatMap((each) => (each.type === 'text' ? (each.text ?? []) : [])).join('\n')
  return { type: 'text', text }
}

function isPersonSignal(message: Stored): boolean {
  return (
    PersonSignal.safeParse(message.content.metadata).success ||
    message.content.parts.some((part) => part.type === USER_MESSAGE_PART)
  )
}

/** Mastra's message as the person reads it: theirs, or the Builder's; none of Mastra's others. */
export function messageOf(message: Stored): Message | undefined {
  const role =
    message.role === 'assistant'
      ? 'builder'
      : message.role === 'user' || (message.role === 'signal' && isPersonSignal(message))
        ? 'person'
        : undefined
  if (role === undefined) return undefined
  return {
    id: message.id,
    role,
    parts: message.content.parts.map(userText),
    model: role === 'builder' ? modelOf(message.content.metadata) : null,
    createdAt: new Date(message.createdAt).toISOString(),
  }
}
