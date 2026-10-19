import { z } from 'zod'

type Lifetime = { after(cleanup: () => Promise<void> | void): void }

const MESSAGES_URL = 'https://api.anthropic.com/v1/messages'
const TOKEN_URL = 'https://console.anthropic.com/v1/oauth/token'
const MODEL = 'claude-sonnet-4-5'

/** One call the Hub made to the Messages API, as the double read it. */
export type Sent = {
  key: string | null
  bearer: string | null
  stream: boolean
  tools: string[]
  system: string
  /** The text of the conversation's messages, in order, so a test sees what the model was given. */
  texts: string[]
}

/** How the double answers one call: text, a `web_fetch` call, a provider's refusal, or a hang. */
export type Reply =
  | { kind: 'text'; text: string }
  | { kind: 'fetch'; url: string }
  | { kind: 'refuse'; status: 400 | 401 | 402 | 403 | 429; headers?: Record<string, string> }
  | { kind: 'hold'; until: Promise<void>; text: string }

export type Anthropic = {
  sent: Sent[]
  /** The token refreshes asked, by refresh token. */
  refreshed: string[]
  answer: (sent: Sent) => Reply
  refresh: (refreshToken: string) => {
    status: number
    tokens?: { access: string; refresh: string }
  }
}

const Body = z.object({
  stream: z.boolean().optional(),
  tools: z.array(z.object({ name: z.string() })).optional(),
  system: z.union([z.string(), z.array(z.object({ text: z.string() }))]).optional(),
  messages: z.array(
    z.object({ content: z.union([z.string(), z.array(z.object({ text: z.string() }).loose())]) }),
  ),
})

function sentOf(init: RequestInit | undefined): Sent {
  const headers = new Headers(init?.headers)
  const body = Body.parse(JSON.parse(String(init?.body)))
  const system =
    typeof body.system === 'string'
      ? body.system
      : (body.system ?? []).map((part) => part.text).join('\n')
  const texts = body.messages.flatMap((message) =>
    typeof message.content === 'string'
      ? [message.content]
      : message.content.flatMap((part) => (typeof part.text === 'string' ? [part.text] : [])),
  )
  const bearer = headers.get('authorization')?.replace(/^Bearer /, '') ?? null
  return {
    key: headers.get('x-api-key'),
    bearer,
    stream: body.stream === true,
    tools: (body.tools ?? []).map((tool) => tool.name),
    system,
    texts,
  }
}

function events(blocks: unknown[], stop: 'end_turn' | 'tool_use'): string {
  const usage = { input_tokens: 10, output_tokens: 1 }
  const message = { id: 'msg_test', type: 'message', role: 'assistant', model: MODEL, content: [] }
  const all = [
    ['message_start', { type: 'message_start', message: { ...message, stop_reason: null, usage } }],
    ...blocks.flatMap((block, index) => {
      const shown = Object(block)
      const start = shown.type === 'text' ? { type: 'text', text: '' } : { ...shown, input: {} }
      const delta =
        shown.type === 'text'
          ? { type: 'text_delta', text: shown.text }
          : { type: 'input_json_delta', partial_json: JSON.stringify(shown.input) }
      return [
        ['content_block_start', { type: 'content_block_start', index, content_block: start }],
        ['content_block_delta', { type: 'content_block_delta', index, delta }],
        ['content_block_stop', { type: 'content_block_stop', index }],
      ]
    }),
    [
      'message_delta',
      { type: 'message_delta', delta: { stop_reason: stop }, usage: { output_tokens: 5 } },
    ],
    ['message_stop', { type: 'message_stop' }],
  ]
  return all.map(([name, data]) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`).join('')
}

/** A stream that sends its text after `until`, so a test holds a turn open. */
function heldStream(until: Promise<void>, text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const [head, ...rest] = events([{ type: 'text', text }], 'end_turn').split('\n\n')
  return new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`${head}\n\n`))
      await until
      controller.enqueue(encoder.encode(rest.join('\n\n')))
      controller.close()
    },
  })
}

function replied(sent: Sent, reply: Reply): Response {
  if (reply.kind === 'refuse') {
    const error = {
      type: 'error',
      error: { type: 'api_error', message: 'planted refusal SECRET-PLANTED-TEXT' },
    }
    const headers = { 'content-type': 'application/json', ...reply.headers }
    return new Response(JSON.stringify(error), { status: reply.status, headers })
  }
  if (reply.kind === 'hold') {
    return new Response(heldStream(reply.until, reply.text), {
      headers: { 'content-type': 'text/event-stream' },
    })
  }
  const blocks =
    reply.kind === 'text'
      ? [{ type: 'text', text: reply.text }]
      : [{ type: 'tool_use', id: 'toolu_test', name: 'web_fetch', input: { url: reply.url } }]
  if (!sent.stream) {
    const content = blocks.map((block) => ({ ...block }))
    const body = { id: 'msg_test', type: 'message', role: 'assistant', model: MODEL, content }
    const usage = { input_tokens: 3, output_tokens: 3 }
    const stop = reply.kind === 'text' ? 'end_turn' : 'tool_use'
    return Response.json({ ...body, stop_reason: stop, stop_sequence: null, usage })
  }
  const stop = reply.kind === 'text' ? 'end_turn' : 'tool_use'
  return new Response(events(blocks, stop), { headers: { 'content-type': 'text/event-stream' } })
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
    answer,
    refresh: () => ({ status: 400 }),
  }
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    if (url.startsWith(TOKEN_URL)) {
      const refreshToken = String(Object(JSON.parse(String(init?.body))).refresh_token)
      anthropic.refreshed.push(refreshToken)
      const { status, tokens } = anthropic.refresh(refreshToken)
      if (tokens === undefined) return Response.json({ error: 'invalid_grant' }, { status })
      const body = { access_token: tokens.access, refresh_token: tokens.refresh, expires_in: 3600 }
      return Response.json(body, { status })
    }
    if (!url.startsWith(MESSAGES_URL)) return await real(input, init)
    const sent = sentOf(init)
    anthropic.sent.push(sent)
    return replied(sent, anthropic.answer(sent))
  }
  t.after(() => {
    globalThis.fetch = real
  })
  return anthropic
}
