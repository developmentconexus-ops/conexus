// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in THIRD_PARTY_LICENSE.txt beside this file.
// From @mastra/code-sdk 1.14.0, dist/providers/claude-max.js (`opencodeClaudeMaxProvider`,
// `buildAnthropicOAuthFetch`, `claudeCodeMiddleware`). Changed: TypeScript; the token is the one the
// queue opened for this call, not a file store; the identity line goes in through the processor's
// system messages instead of a middleware; no prompt cache or thinking middleware.
import { createAnthropic } from '@ai-sdk/anthropic'

const OAUTH_REQUIRED_BETAS = [
  'oauth-2025-04-20',
  'claude-code-20250219',
  'interleaved-thinking-2025-05-14',
  'fine-grained-tool-streaming-2025-05-14',
]

/** The endpoint of a subscription answers only a conversation that opens with this line. */
export const SUBSCRIPTION_IDENTITY = "You are Claude Code, Anthropic's official CLI for Claude."

/** The subscription's model for one call: the access token as a bearer, never as an API key. */
export function subscriptionModel(modelId: string, accessToken: string) {
  const provider = createAnthropic({
    apiKey: 'oauth-placeholder',
    fetch: async (url, init) => {
      const headers = new Headers(url instanceof Request ? url.headers : undefined)
      for (const [key, value] of new Headers(init?.headers)) headers.set(key, value)
      headers.delete('authorization')
      headers.delete('x-api-key')
      headers.set('Authorization', `Bearer ${accessToken}`)
      const requested = (headers.get('anthropic-beta') ?? '').split(',').map((beta) => beta.trim())
      const betas = new Set([...OAUTH_REQUIRED_BETAS, ...requested.filter(Boolean)])
      headers.set('anthropic-beta', [...betas].join(','))
      headers.set('anthropic-version', '2023-06-01')
      return fetch(url, { ...init, headers })
    },
  })
  return provider(modelId)
}
