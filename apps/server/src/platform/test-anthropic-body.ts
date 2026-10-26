import { z } from 'zod'

type Cached = { at: 'system' | 'message'; ttl: string }

/** A file the model was given as a block of its own, not as text. */
export type Media = { type: 'document' | 'image'; mediaType: string }

/** One call the Hub made to the Messages API, as the double read it. */
export type Sent = {
  key: string | null
  bearer: string | null
  stream: boolean
  tools: string[]
  system: string
  /** The text of the conversation's messages, in order, so a test sees what the model was given. */
  texts: string[]
  /** The documents and images of the conversation's messages, in order. */
  media: Media[]
  /** The extended thinking the call asked for, as the Messages API body names it, or none. */
  thinking: Thinking | null
  /** The prompt-cache marks the call asked for, in body order: where each sits and its TTL. */
  cached: Cached[]
}

const Thinking = z.object({ type: z.string(), budget_tokens: z.number().optional() })
type Thinking = z.infer<typeof Thinking>

const CacheControl = z.object({ type: z.literal('ephemeral'), ttl: z.string().optional() })

const Body = z.object({
  stream: z.boolean().optional(),
  thinking: Thinking.optional(),
  tools: z.array(z.object({ name: z.string() })).optional(),
  tool_choice: z.object({ type: z.string() }).optional(),
  system: z
    .union([
      z.string(),
      z.array(z.object({ text: z.string(), cache_control: CacheControl.optional() })),
    ])
    .optional(),
  messages: z.array(z.object({ content: z.union([z.string(), z.array(z.unknown())]) })),
})
const MediaPart = z.object({
  type: z.enum(['document', 'image']),
  source: z.object({ media_type: z.string() }),
})
const TextPart = z.object({ text: z.string() })
const ToolResult = z.object({
  type: z.literal('tool_result'),
  content: z.union([z.string(), z.array(TextPart)]),
})

/** A message part as the model reads it: its text, or a tool's result; none for the rest. */
function textOf(part: unknown): string[] {
  const result = ToolResult.safeParse(part)
  if (result.success) {
    const { content } = result.data
    return [typeof content === 'string' ? content : content.map((each) => each.text).join('')]
  }
  const text = TextPart.safeParse(part)
  return text.success ? [text.data.text] : []
}

/** A message part that is a document or an image; none for the rest. */
function mediaOf(part: unknown): Media[] {
  const media = MediaPart.safeParse(part)
  return media.success ? [{ type: media.data.type, mediaType: media.data.source.media_type }] : []
}

/** The cache marks of a body, the system's first, then the messages' parts; no ttl is Anthropic's 5 minutes. */
function marks(at: Cached['at'], part: unknown): Cached[] {
  const mark = z.object({ cache_control: CacheControl }).safeParse(part)
  return mark.success ? [{ at, ttl: mark.data.cache_control.ttl ?? '5m' }] : []
}

function cachedOf(body: z.infer<typeof Body>): Cached[] {
  const system =
    typeof body.system === 'object' ? body.system.flatMap((part) => marks('system', part)) : []
  const messages = body.messages.flatMap((message) =>
    typeof message.content === 'string'
      ? []
      : message.content.flatMap((part) => marks('message', part)),
  )
  return [...system, ...messages]
}

export function sentOf(init: RequestInit | undefined): Sent {
  const headers = new Headers(init?.headers)
  const body = Body.parse(JSON.parse(String(init?.body)))
  const system =
    typeof body.system === 'string'
      ? body.system
      : (body.system ?? []).map((part) => part.text).join('\n')
  const texts = body.messages.flatMap((message) =>
    typeof message.content === 'string' ? [message.content] : message.content.flatMap(textOf),
  )
  const media = body.messages.flatMap((message) =>
    typeof message.content === 'string' ? [] : message.content.flatMap(mediaOf),
  )
  const bearer = headers.get('authorization')?.replace(/^Bearer /, '') ?? null
  return {
    key: headers.get('x-api-key'),
    bearer,
    stream: body.stream === true,
    // `tool_choice: none` offers the model no tool, as the router's model asked it with an empty list.
    tools: body.tool_choice?.type === 'none' ? [] : (body.tools ?? []).map((tool) => tool.name),
    system,
    texts,
    media,
    thinking: body.thinking ?? null,
    cached: cachedOf(body),
  }
}
