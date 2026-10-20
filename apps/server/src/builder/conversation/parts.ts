import type { Message, MessagePart } from '@conexus/hub-api'
import { MessageId, ModelId, SUBJECT_MAX_LENGTH } from '@conexus/hub-api'
import type { MastraDBMessage, MastraMessagePart } from '@mastra/core/agent-controller'
import { z } from 'zod'
import { NOTICE_PART, Notice as NoticeData } from '../model-accounts/public.ts'

type ToolPart = Extract<MessagePart, { type: 'tool' }>

/** The kind of each of the Builder's tools, by its name; any other is `other` (code C26). */
const KINDS: Readonly<Record<string, ToolPart['kind']>> = {
  web_fetch: 'read_page',
  web_search: 'search_web',
  recall: 'recall',
}

const Text = z.object({ type: z.literal('text'), text: z.string() })
const Reasoning = z.object({ type: z.literal('reasoning') })
const Invocation = z.object({
  type: z.literal('tool-invocation'),
  toolInvocation: z.object({
    toolCallId: z.string().min(1),
    toolName: z.string(),
    state: z.enum([
      'partial-call',
      'call',
      'approval-requested',
      'approval-responded',
      'result',
      'output-error',
      'output-denied',
    ]),
    args: z.unknown(),
    result: z.unknown().optional(),
    isError: z.boolean().optional(),
  }),
})
type Invocation = z.infer<typeof Invocation>['toolInvocation']
// A tool that answers its own failure, as `web_fetch` does, rather than throwing.
const FailedResult = z.object({ isError: z.literal(true) })
const PageArgs = z.object({ url: z.url() })
const SearchArgs = z.object({ query: z.string() })
const Notice = z.object({ type: z.literal(NOTICE_PART), data: NoticeData })
const PersonSignal = z.object({ signal: z.object({ type: z.literal('user') }) })
const Answered = z.object({ modelId: z.string().min(1), provider: z.string().min(1) })

function cut(text: string): string {
  return text.slice(0, SUBJECT_MAX_LENGTH)
}

function stateOf(invocation: Invocation): ToolPart['state'] {
  switch (invocation.state) {
    case 'partial-call':
    case 'call':
    case 'approval-requested':
    case 'approval-responded':
      return 'running'
    case 'output-error':
    case 'output-denied':
      return 'error'
    case 'result':
      return invocation.isError === true || FailedResult.safeParse(invocation.result).success
        ? 'error'
        : 'completed'
    default:
      return invocation.state satisfies never
  }
}

function subjectOf(kind: ToolPart['kind'], args: unknown): ToolPart['subject'] {
  const page = kind === 'read_page' ? PageArgs.safeParse(args) : undefined
  if (page?.success) return { url: page.data.url, title: null }
  const search = kind === 'search_web' ? SearchArgs.safeParse(args) : undefined
  if (search?.success) return { query: cut(search.data.query) }
  return null
}

/** A tool call as the person sees it: its kind, its state and what it was about, never its data. */
function toolOf(invocation: Invocation): ToolPart {
  const kind = KINDS[invocation.toolName] ?? 'other'
  const subject = subjectOf(kind, invocation.args)
  return { type: 'tool', id: invocation.toolCallId, kind, state: stateOf(invocation), subject }
}

/** Where a part of Mastra's sits: its message and place in it, which name a thinking part. */
export type Place = { messageId: MessageId; index: number }

/** The id of the thinking at `place`, the same live and read again. */
function reasoningId(place: Place): string {
  return `${place.messageId}.${place.index}`
}

/**
 * What the person sees of one of Mastra's parts: its text, that it thought (never what), a tool
 * call, and a queue notice; the rest stays inside. Thinking read here is over and has no time.
 */
export function partOf(part: MastraMessagePart | unknown, place: Place): MessagePart | undefined {
  const text = Text.safeParse(part)
  if (text.success) return text.data
  if (Reasoning.safeParse(part).success) {
    return { type: 'reasoning', id: reasoningId(place), state: 'completed', seconds: null }
  }
  const invocation = Invocation.safeParse(part)
  if (invocation.success) return toolOf(invocation.data.toolInvocation)
  const notice = Notice.safeParse(part)
  if (notice.success) return { type: 'notice', text: notice.data.data.text }
  return undefined
}

/** The model that answered a message, `provider/model` as the router names it, or none. */
export function modelOf(message: { content: { metadata?: unknown } }): ModelId | null {
  const answered = Answered.safeParse(message.content.metadata)
  if (!answered.success) return null
  const model = ModelId.safeParse(`${answered.data.provider}/${answered.data.modelId}`)
  return model.success ? model.data : null
}

/** A stored message as the person reads it: theirs, or the Builder's; none of Mastra's others. */
export function messageOf(message: MastraDBMessage): Message | undefined {
  const role =
    message.role === 'assistant'
      ? 'builder'
      : message.role === 'user' ||
          (message.role === 'signal' && PersonSignal.safeParse(message.content.metadata).success)
        ? 'person'
        : undefined
  if (role === undefined) return undefined
  const id = MessageId.parse(message.id)
  // Text after text is one text, as the stream tells it: Mastra keeps each of the provider's
  // blocks, and Claude cuts an answer into one block per span it cites.
  const parts: MessagePart[] = []
  for (const [index, part] of message.content.parts.entries()) {
    const shown = partOf(part, { messageId: id, index })
    const last = parts.at(-1)
    if (shown?.type === 'text' && last?.type === 'text') last.text += shown.text
    else if (shown !== undefined) parts.push(shown)
  }
  return {
    id,
    role,
    parts,
    model: role === 'builder' ? modelOf(message) : null,
    createdAt: new Date(message.createdAt).toISOString(),
  }
}
