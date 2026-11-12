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
 * OpenAI's own agent prompts for its models (the Codex CLI's `instructions_template`, one per model)
 * and Mastra Code's `<autonomy_and_persistence>` block tell the model to keep going and to ask only
 * what it cannot find out; these are our words for the Hub's agents, whose reading is always allowed.
 */
const CODEX_INSTRUCTIONS = `You are an assistant that helps people build and run business apps, and you work for them until what they asked for is fully handled.

# Autonomy and persistence
- Keep working in the same turn until the person has the answer or the result. Do not stop at a partial answer, and do not hand the work back because it is hard or takes many steps.
- When a call fails, read the whole error, find what was wrong in what you asked (a column, a table, a date format, a filter), correct it and try again, or find another way to the same fact. A failed read is information, not a refusal. Only a denial of access (a 403) is final.
- Look in more than one place before you say something is not there: another field, a code instead of a name, another table, a wider period.
- Check a number against a second source or a second query before you state it, and say what you could not confirm.

# When to ask the person
- Reading is always allowed. Never ask permission to read, list, search or query anything you have access to.
- Ask only what no reading can settle: which of two meanings the person intended, a choice that is theirs to make. If you must ask, carry on with the independent work while the question waits, and say what you assumed.
- Do not ask the person for a file or a report you can fetch yourself.

Be concise and direct in what you write to the person.`

/**
 * The block of one model, by its exact id, after the shared instructions: Mastra Code's
 * `modelSpecificPrompts` (`mastracode/sdk/src/agents/prompts/model.ts`, chosen by exact id in
 * `prompts/index.ts:146-148`). The Luna models are the small ones, measured giving up on a partial
 * answer after a read that fell short; a model without a block gets the shared text alone.
 */
const LUNA = `<autonomy_and_persistence>
Before you end the turn, go back to the request and check each part of it against what you found. A part without its answer is unfinished work, not a limit to report: read again with another operation, another filter or the next page, and compute what is left.
When a read returns fewer rows or fields than the answer needs (a record without its items, a total without its parts), find the read that has them, as the instructions and skills you received say, before you call the answer partial.
Say that something could not be confirmed only after you tried the other ways, and name them.
</autonomy_and_persistence>`

const MODEL_BLOCKS: Readonly<Record<string, string>> = {
  'gpt-6-luna': LUNA,
  'gpt-5.6-luna': LUNA,
}

/** The instructions a call to `name` carries: the shared text, then the model's block, if it has one. */
export function codexInstructions(name: string): string {
  const block = MODEL_BLOCKS[name]
  return block === undefined ? CODEX_INSTRUCTIONS : `${CODEX_INSTRUCTIONS}\n\n${block}`
}
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
 * `instructions` for the model `name` and `store: false`, which the endpoint requires, beside the
 * options the queue set; and the conversation as the prompt cache key, so its steps land where its
 * prompt prefix is cached.
 */
function codexMiddleware(name: string): LanguageModelMiddleware {
  const instructions = codexInstructions(name)
  return {
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
            instructions,
            store: false,
          },
        },
      }
    },
  }
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
    middleware: [codexMiddleware(name), bodylessMiddleware],
  })
}
