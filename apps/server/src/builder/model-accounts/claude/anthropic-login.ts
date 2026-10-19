// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in THIRD_PARTY_LICENSE.txt beside this file.
// From @mastra/code-sdk 1.14.0, dist/auth/providers/anthropic.js with dist/auth/pkce.js and
// dist/auth/authorization-input.js. Changed: TypeScript, node:crypto for PKCE, only the start, the
// trade and the refresh, the reply checked, and a refusal that carries the vendor's status.
import { createHash, randomBytes } from 'node:crypto'
import { z } from 'zod'

const CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e'
const AUTHORIZE_URL = 'https://claude.ai/oauth/authorize'
const TOKEN_URL = 'https://console.anthropic.com/v1/oauth/token'
const REDIRECT_URI = 'https://console.anthropic.com/oauth/code/callback'
const SCOPES = 'org:create_api_key user:profile user:inference'
// The package's deadline for the trade (code C57).
const EXCHANGE_TIMEOUT_MS = 15_000
// The vendor's expiry, five minutes early, as the package keeps it.
const EARLY_MS = 300_000

const TokenReply = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.number().positive(),
})

/** Anthropic refused the code: `status` is the trade's HTTP status, or none before any call. */
export class AnthropicRefusal extends Error {
  readonly status: number | undefined

  constructor(reason: string, status?: number) {
    super(reason)
    this.name = 'AnthropicRefusal'
    this.status = status
  }
}

export function startAnthropicLogin(): { url: string; verifier: string } {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  const params = new URLSearchParams({
    code: 'true',
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: verifier,
  })
  return { url: `${AUTHORIZE_URL}?${params}`, verifier }
}

/** What the person pasted: the callback address, the page's `code#state`, a query, or a code. */
function parseAuthorizationInput(input: string): { code?: string; state?: string } {
  const value = input.trim()
  if (value === '') return {}
  if (URL.canParse(value)) {
    const { searchParams } = new URL(value)
    return {
      code: searchParams.get('code') ?? undefined,
      state: searchParams.get('state') ?? undefined,
    }
  }
  if (value.includes('#')) {
    const [code, state] = value.split('#', 2)
    return { code, state }
  }
  if (value.includes('code=')) {
    const params = new URLSearchParams(value)
    return { code: params.get('code') ?? undefined, state: params.get('state') ?? undefined }
  }
  return { code: value }
}

/** The subscription's tokens, sealed whole in its account: `expires` is milliseconds since 1970. */
export const SubscriptionTokens = z.object({
  refresh: z.string().min(1),
  access: z.string().min(1),
  expires: z.number(),
})
export type SubscriptionTokens = z.infer<typeof SubscriptionTokens>

async function tokensOf(response: Response): Promise<SubscriptionTokens> {
  const tokens = TokenReply.parse(await response.json())
  return {
    refresh: tokens.refresh_token,
    access: tokens.access_token,
    expires: Date.now() + tokens.expires_in * 1000 - EARLY_MS,
  }
}

/** Trades the refresh token for new tokens (`refreshAnthropicToken`, `anthropic.ts:130`). */
export async function refreshAnthropicTokens(refresh: string): Promise<SubscriptionTokens> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    signal: AbortSignal.timeout(EXCHANGE_TIMEOUT_MS),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      refresh_token: refresh,
    }),
  })
  if (!response.ok) throw new AnthropicRefusal('REFRESH_REFUSED', response.status)
  return tokensOf(response)
}

/** Trades the pasted code for the subscription's tokens with the verifier `start` gave. */
export async function completeAnthropicLogin(input: string, verifier: string) {
  const { code, state } = parseAuthorizationInput(input)
  if (!code) throw new AnthropicRefusal('MISSING_CODE')
  if (!state || state !== verifier) throw new AnthropicRefusal('STATE_MISMATCH')
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    signal: AbortSignal.timeout(EXCHANGE_TIMEOUT_MS),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code,
      state,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  })
  if (!response.ok) throw new AnthropicRefusal('EXCHANGE_REFUSED', response.status)
  return tokensOf(response)
}
