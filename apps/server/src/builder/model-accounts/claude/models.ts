// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in THIRD_PARTY_LICENSE.txt beside this file.
// The prompt-cache middleware and the subscription model are from @mastra/code-sdk and
// mastra-ai/mastra; each part's origin is named above it.

import { createAnthropic } from '@ai-sdk/anthropic'
import type { LanguageModelMiddleware } from 'ai'
import { wrapLanguageModel } from 'ai'

// From mastra-ai/mastra at @mastra/core@1.78.0, mastracode/sdk/src/providers/claude-max.ts
// (`createPromptCacheMiddleware`) and anthropic-prompt-cache.ts. Changed: TypeScript without `any`;
// named `promptCacheMiddleware`.
type Transform = NonNullable<LanguageModelMiddleware['transformParams']>
type Message = Parameters<Transform>[0]['params']['prompt'][number]

/** A part that can carry a provider's options. */
type Marked = { providerOptions?: Message['providerOptions'] }

/** The agent's breakpoints' TTL; `activateAfterIdle` names the same for Anthropic (`builder.ts`). */
const PROMPT_CACHE_TTL = '1h'

/**
 * `conversation`: the last system message and the latest message, 1 h, for the agent's steps.
 * `system`: the last system message only, 5 min, for the title, the observer and the reflector,
 * whose content changes every call.
 */
export type PromptCacheScope = 'conversation' | 'system'
const PROMPT_CACHE_SCOPES = [
  'conversation',
  'system',
] as const satisfies readonly PromptCacheScope[]

export function promptCacheMiddleware(scope: PromptCacheScope): LanguageModelMiddleware {
  const cacheControl = {
    type: 'ephemeral',
    ttl: scope === 'conversation' ? PROMPT_CACHE_TTL : '5m',
  } as const
  function marked(message: Message): Message {
    switch (message.role) {
      case 'system': {
        const anthropic = { ...message.providerOptions?.anthropic, cacheControl }
        return { ...message, providerOptions: { ...message.providerOptions, anthropic } }
      }
      case 'user':
        return { ...message, content: lastMarked(message.content) }
      case 'assistant':
        return { ...message, content: lastMarked(message.content) }
      case 'tool':
        return { ...message, content: lastMarked(message.content) }
    }
  }
  function lastMarked<Part extends Marked>(parts: Part[]): Part[] {
    const last = parts.at(-1)
    if (last === undefined) return parts
    const anthropic = { ...last.providerOptions?.anthropic, cacheControl }
    return [
      ...parts.slice(0, -1),
      { ...last, providerOptions: { ...last.providerOptions, anthropic } },
    ]
  }
  return {
    specificationVersion: 'v3',
    transformParams: async ({ params }) => {
      const system = params.prompt.findLastIndex((message) => message.role === 'system')
      const latest = scope === 'conversation' ? params.prompt.length - 1 : -1
      const prompt = params.prompt.map((message, index) =>
        index === system || index === latest ? marked(message) : message,
      )
      return { ...params, prompt }
    },
  }
}

// From @mastra/code-sdk 1.14.0, dist/providers/claude-max.js (`opencodeClaudeMaxProvider`,
// `buildAnthropicOAuthFetch`, `claudeCodeMiddleware`). Changed: TypeScript; the token is the one the
// queue opened for this call, not a file store; no thinking middleware (the
// effort goes by the queue's processor).
const OAUTH_REQUIRED_BETAS = [
  'oauth-2025-04-20',
  'claude-code-20250219',
  'interleaved-thinking-2025-05-14',
  'fine-grained-tool-streaming-2025-05-14',
]

/** The endpoint of a subscription answers only a conversation that opens with this line. */
const SUBSCRIPTION_IDENTITY = "You are Claude Code, Anthropic's official CLI for Claude."

/**
 * The identity line first in every prompt of the model, so the title's and the observer's calls
 * carry it as the conversation's does.
 */
const identityMiddleware: LanguageModelMiddleware = {
  specificationVersion: 'v3',
  transformParams: async ({ params }) => ({
    ...params,
    prompt: [{ role: 'system', content: SUBSCRIPTION_IDENTITY }, ...params.prompt],
  }),
}

/**
 * The headers of a call as the subscription's endpoint takes it: the access token as a bearer,
 * never as an API key, and the betas it requires beside those `headers` already ask for.
 */
function subscriptionHeaders(headers: Headers, accessToken: string): Headers {
  const sent = new Headers(headers)
  sent.delete('authorization')
  sent.delete('x-api-key')
  sent.set('Authorization', `Bearer ${accessToken}`)
  const requested = (sent.get('anthropic-beta') ?? '').split(',').map((beta) => beta.trim())
  const betas = new Set([...OAUTH_REQUIRED_BETAS, ...requested.filter(Boolean)])
  sent.set('anthropic-beta', [...betas].join(','))
  sent.set('anthropic-version', '2023-06-01')
  return sent
}

/** The subscription's model for one call: the access token as a bearer, never as an API key. */
export function subscriptionModel(modelName: string, accessToken: string, scope: PromptCacheScope) {
  const provider = createAnthropic({
    apiKey: 'oauth-placeholder',
    fetch: async (url, init) => {
      const headers = new Headers(url instanceof Request ? url.headers : undefined)
      for (const [key, value] of new Headers(init?.headers)) headers.set(key, value)
      return fetch(url, { ...init, headers: subscriptionHeaders(headers, accessToken) })
    },
  })
  return wrapLanguageModel({
    model: provider(modelName),
    middleware: [identityMiddleware, promptCacheMiddleware(scope)],
  })
}

/** An API key's Claude model, built as Mastra Code builds it so the cache marks can wrap it (the router's model is v2). */
export function apiKeyModel(modelName: string, apiKey: string, scope: PromptCacheScope) {
  return wrapLanguageModel({
    model: createAnthropic({ apiKey })(modelName),
    middleware: promptCacheMiddleware(scope),
    providerId: 'anthropic',
  })
}
