// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in THIRD_PARTY_LICENSE.txt beside this file.
// From @mastra/code-sdk 1.14.0, dist/providers/claude-max.js (`opencodeClaudeMaxProvider`,
// `buildAnthropicOAuthFetch`, `claudeCodeMiddleware`). Changed: TypeScript; the token is the one the
// queue opened for this call, not a file store; no prompt cache or thinking middleware.

import { createAnthropic } from '@ai-sdk/anthropic'
import type { LanguageModelMiddleware } from 'ai'
import { wrapLanguageModel } from 'ai'

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
export function subscriptionModel(modelName: string, accessToken: string) {
  const provider = createAnthropic({
    apiKey: 'oauth-placeholder',
    fetch: async (url, init) => {
      const headers = new Headers(url instanceof Request ? url.headers : undefined)
      for (const [key, value] of new Headers(init?.headers)) headers.set(key, value)
      return fetch(url, { ...init, headers: subscriptionHeaders(headers, accessToken) })
    },
  })
  return wrapLanguageModel({ model: provider(modelName), middleware: identityMiddleware })
}
