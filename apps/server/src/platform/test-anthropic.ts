import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { Block } from './test-anthropic-stream.ts'
import { events } from './test-anthropic-stream.ts'

type Lifetime = { after(cleanup: () => Promise<void> | void): void }

const MESSAGES_URL = 'https://api.anthropic.com/v1/messages'
const CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions'
const TOKEN_URL = 'https://console.anthropic.com/v1/oauth/token'
const MODEL = 'claude-sonnet-4-6'
/** The line the subscription's endpoint requires first in the system of a bearer call. */
const SUBSCRIPTION_LINE = "You are Claude Code, Anthropic's official CLI for Claude."

/** One call the Hub made to the Messages API, as the double read it. */
export type Sent = {
  key: string | null
  bearer: string | null
  stream: boolean
  tools: string[]
  system: string
  /** The text of the conversation's messages, in order, so a test sees what the model was given. */
  texts: string[]
  /** The extended thinking the call asked for, as the Messages API body names it, or none. */
  thinking: Thinking | null
}

/**
 * How the double answers one call: text, a `web_fetch` call, the blocks given, a provider's
 * refusal, a hang, a connection the provider resets in the middle of its stream, or (Chat
 * Completions only) a stream that ends with no content on Gemini's `MALFORMED_FUNCTION_CALL`, as
 * CLIProxy relays it.
 */
export type Reply =
  | { kind: 'text'; text: string }
  | { kind: 'fetch'; url: string }
  | { kind: 'blocks'; blocks: Block[] }
  | { kind: 'refuse'; status: Refusal; headers?: Record<string, string> }
  | { kind: 'hold'; until: Promise<void>; text?: string; rest?: string }
  | { kind: 'reset' }
  | { kind: 'malformed' }

/** The Messages API's `error.type` for each status it answers (its documented errors). */
const ERROR_TYPES = {
  400: 'invalid_request_error',
  401: 'authentication_error',
  402: 'billing_error',
  403: 'permission_error',
  429: 'rate_limit_error',
  500: 'api_error',
  529: 'overloaded_error',
} as const
type Refusal = keyof typeof ERROR_TYPES

export type Anthropic = {
  sent: Sent[]
  /** The token refreshes asked, by refresh token. */
  refreshed: string[]
  /** Every other address the process fetched, passed on to the real `fetch`. */
  elsewhere: string[]
  answer: (sent: Sent) => Reply
  /** The calls made to a second provider, Groq's Chat Completions, and how the double answers them. */
  chats: Sent[]
  chat: (sent: Sent) => Reply
  refresh: (refreshToken: string) => {
    status: number
    tokens?: { access: string; refresh: string; expiresIn?: number }
  }
}

const ChatBody = z.object({
  stream: z.boolean().optional(),
  tools: z.array(z.object({ function: z.object({ name: z.string() }) })).optional(),
  messages: z.array(
    z.object({
      role: z.string(),
      content: z.union([z.string(), z.array(z.object({ text: z.string() }).loose()), z.null()]),
    }),
  ),
})

function chatSentOf(init: RequestInit | undefined): Sent {
  const headers = new Headers(init?.headers)
  const body = ChatBody.parse(JSON.parse(String(init?.body)))
  const texts = body.messages.flatMap((message) => {
    const { content } = message
    if (content === null) return []
    return typeof content === 'string' ? [content] : content.map((part) => String(part.text))
  })
  return {
    key: null,
    bearer: headers.get('authorization')?.replace(/^Bearer /, '') ?? null,
    stream: body.stream === true,
    tools: (body.tools ?? []).map((tool) => tool.function.name),
    system: body.messages.find((message) => message.role === 'system')?.content?.toString() ?? '',
    texts,
    thinking: null,
  }
}

/** A chat stream that sends its first chunks, then the rest only after `until`, to hold a turn open. */
function heldChat(until: Promise<void>, lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(lines.slice(0, 2).join('')))
      await until
      controller.enqueue(encoder.encode(lines.slice(2).join('')))
      controller.close()
    },
  })
}

/** Chat Completions' documented stream: chunks of `choices[].delta`, then `[DONE]`. */
function chatReplied(sent: Sent, reply: Reply): Response {
  if (reply.kind === 'refuse') {
    const error = { error: { message: 'planted refusal', type: 'invalid_request_error' } }
    return Response.json(error, { status: reply.status, headers: reply.headers })
  }
  const text = reply.kind === 'text' || reply.kind === 'hold' ? (reply.text ?? '') : ''
  const base = { id: 'chatcmpl-test', created: 1, model: 'llama-3.3-70b-versatile' }
  const usage = { prompt_tokens: 3, completion_tokens: 3, total_tokens: 6 }
  if (!sent.stream) {
    const message = { role: 'assistant', content: text }
    const choices = [{ index: 0, message, finish_reason: 'stop' }]
    return Response.json({ ...base, object: 'chat.completion', choices, usage })
  }
  function chunk(delta: object, finish: string | null) {
    const choices = [{ index: 0, delta, finish_reason: finish }]
    return { ...base, object: 'chat.completion.chunk', choices }
  }
  const frames =
    reply.kind === 'malformed'
      ? [chunk({ role: 'assistant', content: '' }, null), chunk({}, 'MALFORMED_FUNCTION_CALL')]
      : [
          chunk({ role: 'assistant', content: '' }, null),
          chunk({ content: text }, null),
          { ...chunk({}, 'stop'), usage },
        ]
  const lines = [...frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`), 'data: [DONE]\n\n']
  if (reply.kind === 'hold') {
    return new Response(heldChat(reply.until, lines), {
      headers: { 'content-type': 'text/event-stream' },
    })
  }
  if (reply.kind === 'reset') return resetStream(lines.slice(0, 1))
  return new Response(lines.join(''), { headers: { 'content-type': 'text/event-stream' } })
}

const Thinking = z.object({ type: z.string(), budget_tokens: z.number().optional() })
type Thinking = z.infer<typeof Thinking>

const Body = z.object({
  stream: z.boolean().optional(),
  thinking: Thinking.optional(),
  tools: z.array(z.object({ name: z.string() })).optional(),
  system: z.union([z.string(), z.array(z.object({ text: z.string() }))]).optional(),
  messages: z.array(z.object({ content: z.union([z.string(), z.array(z.unknown())]) })),
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

function sentOf(init: RequestInit | undefined): Sent {
  const headers = new Headers(init?.headers)
  const body = Body.parse(JSON.parse(String(init?.body)))
  const system =
    typeof body.system === 'string'
      ? body.system
      : (body.system ?? []).map((part) => part.text).join('\n')
  const texts = body.messages.flatMap((message) =>
    typeof message.content === 'string' ? [message.content] : message.content.flatMap(textOf),
  )
  const bearer = headers.get('authorization')?.replace(/^Bearer /, '') ?? null
  return {
    key: headers.get('x-api-key'),
    bearer,
    stream: body.stream === true,
    tools: (body.tools ?? []).map((tool) => tool.name),
    system,
    texts,
    thinking: body.thinking ?? null,
  }
}

/**
 * A stream that sends its text, then ends only after `until`, so a test holds a turn open; with no
 * text it sends nothing until then, a model called and silent. With `rest`, that text arrives as a
 * second delta after `until`, so the hold falls between two deltas of one answer.
 */
function heldStream(
  until: Promise<void>,
  text?: string,
  rest?: string,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const frames = events(MODEL, [{ type: 'text', text: text ?? '' }], 'end_turn').split('\n\n')
  // The message's start, its text block's start and its text; then its end.
  const cut = text === undefined ? 0 : 3
  const head = frames.slice(0, cut)
  const tail = frames.slice(cut)
  const more = { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: rest } }
  return new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`${head.join('\n\n')}\n\n`))
      await until
      if (rest !== undefined) {
        controller.enqueue(
          encoder.encode(`event: content_block_delta\ndata: ${JSON.stringify(more)}\n\n`),
        )
      }
      controller.enqueue(encoder.encode(tail.join('\n\n')))
      controller.close()
    },
  })
}

/**
 * A stream whose connection the provider resets after its first frames, as Node's `fetch` reports
 * it: `terminated`, caused by the socket's `ECONNRESET`.
 */
function resetStream(head: string[]): Response {
  const encoder = new TextEncoder()
  const socket = Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' })
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(head.join('')))
      controller.error(new TypeError('terminated', { cause: socket }))
    },
  })
  return new Response(body, { headers: { 'content-type': 'text/event-stream' } })
}

function replied(sent: Sent, reply: Reply): Response {
  if (reply.kind === 'refuse') {
    const error = {
      type: 'error',
      error: {
        type: ERROR_TYPES[reply.status],
        message: 'planted refusal SECRET-PLANTED-TEXT',
      },
    }
    const headers = { 'content-type': 'application/json', ...reply.headers }
    return new Response(JSON.stringify(error), { status: reply.status, headers })
  }
  if (reply.kind === 'hold') {
    return new Response(heldStream(reply.until, reply.text, reply.rest), {
      headers: { 'content-type': 'text/event-stream' },
    })
  }
  if (reply.kind === 'malformed') throw new Error('The Messages API has no MALFORMED_FUNCTION_CALL')
  if (reply.kind === 'reset') {
    const [start = ''] = events(MODEL, [], 'end_turn').split('\n\n')
    return resetStream([`${start}\n\n`])
  }
  const blocks: Block[] =
    reply.kind === 'blocks'
      ? reply.blocks
      : reply.kind === 'text'
        ? [{ type: 'text', text: reply.text }]
        : [{ type: 'tool_use', name: 'web_fetch', input: { url: reply.url } }]
  const stop = blocks.some((block) => block.type === 'tool_use') ? 'tool_use' : 'end_turn'
  if (!sent.stream) {
    const content = blocks.flatMap((block): object[] => {
      if (block.type === 'text') return [block]
      return block.type === 'tool_use' ? [{ ...block, id: `toolu_${randomUUID()}` }] : []
    })
    const body = { id: 'msg_test', type: 'message', role: 'assistant', model: MODEL, content }
    const usage = { input_tokens: 3, output_tokens: 3 }
    return Response.json({ ...body, stop_reason: stop, stop_sequence: null, usage })
  }
  return new Response(events(MODEL, blocks, stop), {
    headers: { 'content-type': 'text/event-stream' },
  })
}

/**
 * Stands in for Anthropic at `fetch` (testing T14): the Messages API in its documented stream and
 * JSON shapes, its error body, and the subscription's token endpoint. Every call is recorded.
 */
export function plantAnthropic(t: Lifetime, answer: Anthropic['answer']): Anthropic {
  const real = globalThis.fetch
  const anthropic: Anthropic = {
    sent: [],
    refreshed: [],
    elsewhere: [],
    answer,
    chats: [],
    chat: () => ({ kind: 'text', text: 'ok' }),
    refresh: () => ({ status: 400 }),
  }
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    if (url.startsWith(TOKEN_URL)) {
      const refreshToken = String(Object(JSON.parse(String(init?.body))).refresh_token)
      anthropic.refreshed.push(refreshToken)
      const { status, tokens } = anthropic.refresh(refreshToken)
      if (tokens === undefined) return Response.json({ error: 'invalid_grant' }, { status })
      const body = {
        access_token: tokens.access,
        refresh_token: tokens.refresh,
        expires_in: tokens.expiresIn ?? 3600,
      }
      return Response.json(body, { status })
    }
    if (url.startsWith(CHAT_URL)) {
      const chat = chatSentOf(init)
      anthropic.chats.push(chat)
      return chatReplied(chat, anthropic.chat(chat))
    }
    if (!url.startsWith(MESSAGES_URL)) {
      anthropic.elsewhere.push(url)
      return await real(input, init)
    }
    const sent = sentOf(init)
    anthropic.sent.push(sent)
    const unidentified = sent.bearer !== null && !sent.system.startsWith(SUBSCRIPTION_LINE)
    return replied(sent, unidentified ? { kind: 'refuse', status: 429 } : anthropic.answer(sent))
  }
  t.after(() => {
    globalThis.fetch = real
  })
  return anthropic
}
