// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in THIRD_PARTY_LICENSE.txt beside this file.
// From @mastra/code-sdk 1.18.0, src/providers/openai-codex.ts (`buildOpenAICodexOAuthFetch`,
// `stripCodexInputItemIds`, `createCodexMiddleware`). Changed: TypeScript with every body read by
// Zod, the token and the account are the ones the queue opened for this call, no thread headers, no
// test branch, and the effort goes by the queue's processor.

import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModelMiddleware } from 'ai'
import { wrapLanguageModel } from 'ai'
import { z } from 'zod'
import { SubscriptionTokens } from '../subscription-store.ts'
import { ORIGINATOR } from './sign-in.ts'

const CODEX_ENDPOINT = 'https://chatgpt.com/backend-api/codex/responses'

/** The endpoint answers only a request that carries instructions; the Hub's prompt stays in `input`. */
const CODEX_INSTRUCTIONS =
  'You are an assistant that helps people build and run business apps. Be concise and direct.'

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

/** `instructions` and `store: false`, which the endpoint requires, beside the options the queue set. */
const codexMiddleware: LanguageModelMiddleware = {
  specificationVersion: 'v3',
  transformParams: async ({ params }) => ({
    ...params,
    providerOptions: {
      ...params.providerOptions,
      openai: {
        ...params.providerOptions?.openai,
        instructions: CODEX_INSTRUCTIONS,
        store: false,
      },
    },
  }),
}

/** Each step's answer without the body of its request (see `claude/models.ts`). */
const bodylessMiddleware: LanguageModelMiddleware = {
  specificationVersion: 'v3',
  wrapStream: async ({ doStream }) => {
    const { request: _request, ...answer } = await doStream()
    return answer
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
      headers.delete('x-api-key')
      headers.delete('content-length')
      headers.set('Authorization', `Bearer ${tokens.access}`)
      headers.set('originator', ORIGINATOR)
      headers.set('User-Agent', ORIGINATOR)
      headers.set('ChatGPT-Account-ID', tokens.accountId)
      const body = typeof init?.body === 'string' ? withoutItemIds(init.body) : init?.body
      return fetch(CODEX_ENDPOINT, { ...init, headers, body })
    },
  })
  return wrapLanguageModel({
    model: provider.responses(name),
    middleware: [codexMiddleware, bodylessMiddleware],
  })
}
