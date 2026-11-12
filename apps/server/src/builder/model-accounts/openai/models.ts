// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in THIRD_PARTY_LICENSE.txt beside this file.
// From @mastra/code-sdk 1.18.0, src/providers/openai-codex.ts (`buildOpenAICodexOAuthFetch`,
// `stripCodexInputItemIds`, `createCodexMiddleware`, `getRequestThreadId`,
// `createPromptCacheKeyMiddleware`). Changed: TypeScript with every body read by Zod, the token and
// the account are the ones the queue opened for this call, no test branch, and the effort goes by
// the queue's processor; the thread is read on every call, not at model construction.

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
 * OpenAI's own agent prompts for its models (the Codex CLI's `instructions_template`) and Mastra
 * Code's `<autonomy_and_persistence>` block tell the model to keep going and to ask only what it
 * cannot find out; these are our words for the Assistant, whose reading is always allowed.
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
      const body = typeof init?.body === 'string' ? withoutItemIds(init.body) : init?.body
      return fetch(CODEX_ENDPOINT, { ...init, headers, body })
    },
  })
  return wrapLanguageModel({
    model: provider.responses(name),
    middleware: [codexMiddleware, bodylessMiddleware],
  })
}
