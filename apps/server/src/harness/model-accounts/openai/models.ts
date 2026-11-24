// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in THIRD_PARTY_LICENSE.txt beside this file.
// From @mastra/code-sdk 1.18.0, src/providers/openai-codex.ts (`buildOpenAICodexOAuthFetch`,
// `stripCodexInputItemIds`, `createCodexMiddleware`, `getRequestThreadId`,
// `createPromptCacheKeyMiddleware`). Changed: TypeScript with every body read by Zod, the token and
// the account are the ones the queue opened for this call, no test branch, and the effort goes by
// the queue's processor; the thread is read on every call, not at model construction.
// `forcedStream` and `aggregated` are `buildCodexStagehandFetch` and `aggregateCodexStream` of the
// same file: a call without streaming (the conversation's title) is sent streamed and its events
// are gathered into the one response the AI SDK expects. Changed: every body read by Zod, and an
// error event or a stream with no response throws.

import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModelMiddleware } from 'ai'
import { wrapLanguageModel } from 'ai'
import { z } from 'zod'
import { bodylessMiddleware } from '../bodyless.ts'
import { SubscriptionTokens } from '../subscription-store.ts'
import { ORIGINATOR } from './sign-in.ts'

const CODEX_ENDPOINT = 'https://chatgpt.com/backend-api/codex/responses'

/**
 * The endpoint answers only a request that carries instructions; the Hub's prompt stays in `input`.
 * As in Mastra Code (`openai-codex.ts`, `CODEX_INSTRUCTIONS`), the text is short and the same for
 * every call of a ChatGPT subscription, whoever makes it: the Assistant, the Builder, the Construtor,
 * the company's agents, and the title, observer and reflector calls. Each agent's rules, and a
 * model's own block, are in that agent's prompt.
 */
const CODEX_INSTRUCTIONS =
  'You help people build and run business apps. Follow the instructions in the messages that come next.'

/** A ChatGPT subscription's sealed tokens: the account is what the endpoint needs beside the token. */
export const CodexTokens = SubscriptionTokens.required({ accountId: true })
export type CodexTokens = z.infer<typeof CodexTokens>

const ResponsesRequest = z.looseObject({ store: z.literal(false), input: z.array(z.unknown()) })
const Item = z.looseObject({ type: z.string().optional() })

/**
 * The request without the ids of its input items. The AI SDK replays earlier output with the
 * server's ids (`rs_…`, `msg_…`, `fc_…`) even when `store` is false, and the endpoint answers 404
 * once its short-lived cache forgets them; the encrypted reasoning carries the chain, and an
 * `item_reference` can never resolve.
 */
function withoutItemIds(body: string): string {
  const request = ResponsesRequest.safeParse(JSON.parse(body))
  if (!request.success) return body
  const input = request.data.input.flatMap((item) => {
    const parsed = Item.safeParse(item)
    if (!parsed.success) return [item]
    const { id: _id, ...rest } = parsed.data
    return rest.type === 'item_reference' ? [] : [rest]
  })
  return JSON.stringify({ ...request.data, input })
}

const StreamFlag = z.looseObject({ stream: z.unknown().optional() })

/** The request streamed: the endpoint answers `400 Stream must be set to true` to a call that is not. `streamed` says it was not, so the answer must be gathered. */
function forcedStream(body: string): { body: string; streamed: boolean } {
  const request = StreamFlag.safeParse(JSON.parse(body))
  if (!request.success || request.data.stream === true) return { body, streamed: false }
  return { body: JSON.stringify({ ...request.data, stream: true }), streamed: true }
}

const Snapshot = z.record(z.string(), z.unknown())
const StreamEvent = z.looseObject({
  type: z.string().optional(),
  response: Snapshot.optional(),
  output_index: z.number().optional(),
  content_index: z.number().optional(),
  delta: z.string().optional(),
  item: z
    .looseObject({ type: z.string().optional(), content: z.array(z.unknown()).optional() })
    .optional(),
})
const StreamedText = z.looseObject({ text: z.string().optional() })

/** The events of a Server-Sent Events body, each parsed from its `data:` lines; a payload that is not a JSON object is a keep-alive, and one that is but not an event throws. */
function eventsOf(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n\n')
    .flatMap((block) => {
      const data = block
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n')
      if (data === '' || data === '[DONE]') return []
      return data.startsWith('{') ? [StreamEvent.parse(JSON.parse(data))] : []
    })
}

type StreamItem = NonNullable<z.infer<typeof StreamEvent>['item']>

const FAILED_EVENTS = new Set(['error', 'response.error', 'response.failed'])
const ITEM_EVENTS = new Set(['response.output_item.added', 'response.output_item.done'])

type Collected = {
  created?: z.infer<typeof Snapshot>
  completed?: z.infer<typeof Snapshot>
  items: Map<number, StreamItem>
  deltas: Map<string, string>
}

/** One event of a stream added to what the stream said so far; a failure event throws. */
function take(into: Collected, event: z.infer<typeof StreamEvent>): void {
  const type = event.type ?? ''
  if (FAILED_EVENTS.has(type))
    throw new Error(`Codex stream error: ${JSON.stringify(event.response ?? event)}`)
  if (type === 'response.created') into.created = event.response ?? into.created
  if (type === 'response.completed') into.completed = event.response ?? into.completed
  if (ITEM_EVENTS.has(type) && event.output_index !== undefined && event.item !== undefined)
    into.items.set(event.output_index, event.item)
  if (type === 'response.output_text.delta') {
    const key = `${event.output_index}:${event.content_index ?? 0}`
    into.deltas.set(key, (into.deltas.get(key) ?? '') + (event.delta ?? ''))
  }
}

/** What the events of a stream said: the snapshots, the output items by index and the text deltas by position. */
function collected(text: string) {
  const into: Collected = { items: new Map(), deltas: new Map() }
  for (const event of eventsOf(text)) take(into, event)
  return { base: into.completed ?? into.created, items: into.items, deltas: into.deltas }
}

/** An item as the stream closed it, its message parts carrying the text the deltas said when the item came without it. */
function withDeltas(index: number, item: StreamItem, deltas: Map<string, string>) {
  if (item.type !== 'message' || item.content === undefined) return item
  const content = item.content.map((part, at) => {
    const said = deltas.get(`${index}:${at}`)
    return said === undefined ? part : { ...StreamedText.parse(part), text: said }
  })
  return { ...item, content }
}

/**
 * The one response a streamed answer adds up to: the final snapshot, its output items as the
 * stream closed them, and the text of each message from the deltas when the item came without it.
 */
function aggregated(text: string): string {
  const { base, items, deltas } = collected(text)
  if (base === undefined) throw new Error('The Codex stream ended without a response')
  const output = [...items.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, item]) => withDeltas(index, item, deltas))
  return JSON.stringify({ ...base, output: output.length > 0 ? output : (base.output ?? []) })
}

/** The conversation a call belongs to: Mastra puts its id, lowercased, in `x-thread-id` on every model call. */
function threadOf(headers: Record<string, string | undefined> | undefined): string | undefined {
  return headers?.['x-thread-id'] || undefined
}

/**
 * `instructions` and `store: false`, which the endpoint requires, beside the options the queue set;
 * and the conversation as the prompt cache key, so its steps land where its prompt prefix is cached.
 */
const codexMiddleware: LanguageModelMiddleware = {
  specificationVersion: 'v3',
  transformParams: async ({ params }) => {
    const thread = threadOf(params.headers)
    return {
      ...params,
      providerOptions: {
        ...params.providerOptions,
        openai: {
          ...(thread ? { promptCacheKey: thread } : {}),
          ...params.providerOptions?.openai,
          instructions: CODEX_INSTRUCTIONS,
          store: false,
        },
      },
    }
  },
}

/**
 * The ChatGPT subscription's model for one call: the access token as a bearer, never as an API key,
 * sent to the Codex endpoint with the ChatGPT account it belongs to.
 */
export function codexModel(name: string, tokens: Pick<CodexTokens, 'access' | 'accountId'>) {
  const provider = createOpenAI({
    apiKey: 'oauth-placeholder',
    fetch: async (_url, init) => {
      const headers = new Headers(init?.headers)
      headers.delete('content-length')
      headers.set('Authorization', `Bearer ${tokens.access}`)
      headers.set('originator', ORIGINATOR)
      headers.set('User-Agent', ORIGINATOR)
      headers.set('ChatGPT-Account-ID', tokens.accountId)
      const thread = headers.get('x-thread-id')
      if (thread) {
        headers.set('session-id', thread)
        headers.set('thread-id', thread)
      }
      const sent =
        typeof init?.body === 'string' ? forcedStream(withoutItemIds(init.body)) : undefined
      if (sent?.streamed) headers.set('Accept', 'text/event-stream')
      const answer = await fetch(CODEX_ENDPOINT, {
        ...init,
        headers,
        body: sent?.body ?? init?.body,
      })
      if (!sent?.streamed || !answer.ok) return answer
      return new Response(aggregated(await answer.text()), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    },
  })
  return wrapLanguageModel({
    model: provider.responses(name),
    middleware: [codexMiddleware, bodylessMiddleware],
  })
}
