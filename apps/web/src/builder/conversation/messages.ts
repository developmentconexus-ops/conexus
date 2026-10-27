import { ModelId } from '@conexus/hub-api'
import type { MastraMessagePart } from '@mastra/client-js'
import { z } from 'zod'
import type { MessageFile } from './attachments.ts'

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
const UserContent = z.union([
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({
    type: z.literal('file'),
    data: z.string(),
    mediaType: z.string(),
    filename: z.string().optional(),
  }),
  z.object({ type: z.string() }),
])
const UserMessageData = z.object({ contents: z.union([z.string(), z.array(UserContent)]) })
function modelOf(metadata: unknown): ModelId | null {
  const answered = Answered.safeParse(metadata)
  if (!answered.success) return null
  return ModelId.safeParse(`${answered.data.provider}/${answered.data.modelId}`).data ?? null
}

/**
 * The words and files a signal carries live, as the parts Mastra stores for it (Factory
 * `withRenderableSignalText`): a file part names its type `mimeType` there.
 */
function userText(part: MastraMessagePart): MastraMessagePart[] {
  if (part.type !== USER_MESSAGE_PART || !('data' in part)) return [part]
  const read = UserMessageData.safeParse(part.data)
  if (!read.success) return [part]
  const { contents } = read.data
  if (typeof contents === 'string') return [{ type: 'text', text: contents }]
  return contents.flatMap((each): MastraMessagePart[] => {
    if ('text' in each) return [{ type: 'text', text: each.text }]
    if (!('data' in each)) return []
    const file = {
      type: 'file' as const,
      data: each.data,
      mimeType: each.mediaType,
      filename: each.filename,
    }
    return [file]
  })
}

function isPersonSignal(message: Stored): boolean {
  return (
    PersonSignal.safeParse(message.content.metadata).success ||
    message.content.parts.some((part) => part.type === USER_MESSAGE_PART)
  )
}

const CompletionFeedback = z.object({ completionResult: z.unknown() })

/** Mastra's message as the person reads it: theirs, or the Builder's; none of Mastra's others. */
export function messageOf(message: Stored): Message | undefined {
  // The words `isTaskComplete` gives the model (`filterMessagesForSubAgent` drops them the same way).
  if (CompletionFeedback.safeParse(message.content.metadata).data?.completionResult)
    return undefined
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
    parts: message.content.parts.flatMap(userText),
    model: role === 'builder' ? modelOf(message.content.metadata) : null,
    createdAt: new Date(message.createdAt).toISOString(),
  }
}

/** A file of the person's message as a chip shows it: its name, and an image's picture. */
export type Chip = { filename: string; image: string | null }

const FilePart = z.object({
  type: z.literal('file'),
  data: z.string(),
  mimeType: z.string(),
  filename: z.string(),
})
/** How Mastra hands the model a text file's words (`createMessageInput`, `agent-controller-DO6rGsQm.js:5241`). */
const TEXT_FILE = /^\[File: (.*)\]\n(`{3,})\n[\s\S]*\n\2$/

export function chipOf(file: Omit<MessageFile, 'data'> & { data: string }): Chip {
  return { filename: file.filename, image: file.mediaType.startsWith('image/') ? file.data : null }
}

/** What the person sent: their words, and a chip for each file, read or inlined by Mastra. */
export function sentOf(message: Message): { text: string; files: Chip[] } {
  const words: string[] = []
  const files: Chip[] = []
  for (const part of message.parts) {
    const file = FilePart.safeParse(part)
    if (file.success) files.push(chipOf({ ...file.data, mediaType: file.data.mimeType }))
    if (part.type !== 'text') continue
    const filename = TEXT_FILE.exec(part.text)?.[1]
    if (filename !== undefined) files.push({ filename, image: null })
    else if (part.text !== '') words.push(part.text)
  }
  return { text: words.join('\n'), files }
}
