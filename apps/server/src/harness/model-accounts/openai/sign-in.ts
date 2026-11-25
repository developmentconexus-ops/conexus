// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in THIRD_PARTY_LICENSE.txt beside this file.
// From @mastra/code-sdk 1.18.0, src/auth/providers/openai-codex.ts. Changed: TypeScript, every reply
// read by Zod and capped, the code trade, the device start and the device poll only (no browser flow,
// no local server), no logging but a refusal that carries the vendor's status, and the Hub's own
// originator.

import { ProviderId } from '@conexus/hub-api'
import { z } from 'zod'
import { cappedText } from '../../../platform/capped-text.ts'
import { Failure } from '../../../platform/failure.ts'
import { Credential } from '../../../platform/seal.ts'
import type { DeviceSignInFlow } from '../sign-ins.ts'
import type { Renewal, SubscriptionTokens } from '../subscription-store.ts'
import { SubscriptionRefusal } from '../subscription-store.ts'

const CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann'
const ISSUER = 'https://auth.openai.com'
const TOKEN_URL = `${ISSUER}/oauth/token`
const DEVICE_USER_CODE_URL = `${ISSUER}/api/accounts/deviceauth/usercode`
const DEVICE_TOKEN_URL = `${ISSUER}/api/accounts/deviceauth/token`
const DEVICE_PAGE_URL = `${ISSUER}/codex/device`
const DEVICE_REDIRECT_URI = `${ISSUER}/deviceauth/callback`
/** The one name the Hub gives the vendor as originator and user agent. */
export const ORIGINATOR = 'conexus'
const CLAIM_PATH = 'https://api.openai.com/auth'
// The package's deadline for each call (code C57) and its reply cap (code C59).
const REQUEST_TIMEOUT_MS = 15_000
const MAX_REPLY_BYTES = 64 * 1024
const DEFAULT_INTERVAL_SECONDS = 5
const DEFAULT_EXPIRES_IN_SECONDS = 3600
// The vendor's expiry, five minutes early, as the Codex keeps it (`manager.rs:215`).
const EARLY_MS = 300_000
// How long a started device sign-in waits for the code to be typed: the vendor's window (15 minutes).
const CODE_SECONDS = 900

const StartReply = z.object({
  device_auth_id: z.string().min(1),
  user_code: z.string().min(1).max(32).optional(),
  usercode: z.string().min(1).max(32).optional(),
  interval: z.union([z.number(), z.string()]).optional(),
})

/** What waits, sealed, for the code to be typed: the vendor's ids and how often it may be asked. */
const Pending = z.object({
  deviceAuthId: z.string().min(1),
  userCode: z.string().min(1),
  retryMs: z.number().int().positive(),
})

const GrantReply = z.object({
  authorization_code: z.string().min(1),
  code_verifier: z.string().min(1),
})

const TokenReply = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.number().positive().optional(),
  id_token: z.string().min(1).optional(),
})

const AccountId = z.string().min(1)
const JwtClaims = z.looseObject({
  chatgpt_account_id: AccountId.optional(),
  [CLAIM_PATH]: z.looseObject({ chatgpt_account_id: AccountId.optional() }).optional(),
})

/** The ChatGPT account id a token's claims carry, at the top or under the vendor's key; none when it cannot be read. */
function accountIdOf(token: string | undefined): string | undefined {
  const payload = token?.split('.')[1]
  if (payload === undefined) return undefined
  try {
    const claims = JwtClaims.safeParse(
      JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')),
    )
    return claims.success
      ? (claims.data.chatgpt_account_id ?? claims.data[CLAIM_PATH]?.chatgpt_account_id)
      : undefined
  } catch (error) {
    if (error instanceof SyntaxError) return undefined
    throw error
  }
}

async function replyOf<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  const text = await cappedText(response.body, MAX_REPLY_BYTES)
  if (text === undefined) throw new Error('The vendor replied with more than the cap.')
  return schema.parse(JSON.parse(text))
}

function post(url: string, body: string, contentType: string) {
  return fetch(url, {
    method: 'POST',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { 'Content-Type': contentType, 'User-Agent': ORIGINATOR },
    body,
  })
}

async function refused(response: Response): Promise<SubscriptionRefusal> {
  await response.body?.cancel()
  return new SubscriptionRefusal('VENDOR_REFUSED', response.status)
}

async function startDeviceLogin() {
  const response = await post(
    DEVICE_USER_CODE_URL,
    JSON.stringify({ client_id: CLIENT_ID, originator: ORIGINATOR }),
    'application/json',
  )
  if (!response.ok) throw await refused(response)
  const reply = await replyOf(response, StartReply)
  const userCode = reply.user_code ?? reply.usercode
  if (userCode === undefined) throw new Error('The vendor replied with no user code.')
  const seconds = Number.parseInt(String(reply.interval ?? ''), 10) || DEFAULT_INTERVAL_SECONDS
  return Pending.parse({
    deviceAuthId: reply.device_auth_id,
    userCode,
    retryMs: Math.max(seconds, 1) * 1000,
  })
}

/** The tokens of a vendor's reply, with the ChatGPT account they belong to; `previous` when they name none. */
async function tokensOf(
  response: Response,
  previousAccountId?: SubscriptionTokens['accountId'],
): Promise<SubscriptionTokens> {
  const tokens = await replyOf(response, TokenReply)
  const accountId =
    accountIdOf(tokens.id_token) ?? accountIdOf(tokens.access_token) ?? previousAccountId
  if (accountId === undefined) throw new SubscriptionRefusal('NO_ACCOUNT_ID')
  const seconds = tokens.expires_in ?? DEFAULT_EXPIRES_IN_SECONDS
  return {
    refresh: tokens.refresh_token,
    access: tokens.access_token,
    expires: Date.now() + seconds * 1000 - EARLY_MS,
    accountId,
  }
}

/** Trades the device grant for the subscription's tokens. */
async function exchange(grant: z.infer<typeof GrantReply>): Promise<SubscriptionTokens> {
  const response = await post(
    TOKEN_URL,
    new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code: grant.authorization_code,
      code_verifier: grant.code_verifier,
      redirect_uri: DEVICE_REDIRECT_URI,
    }).toString(),
    'application/x-www-form-urlencoded',
  )
  if (!response.ok) throw await refused(response)
  return tokensOf(response)
}

/**
 * The renewal of a ChatGPT subscription's tokens (the refresh token rotates): the account the old
 * tokens named stays when the new ones name none.
 */
export const codexRenewal: Renewal = async (tokens) => {
  const response = await post(
    TOKEN_URL,
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh,
      client_id: CLIENT_ID,
    }).toString(),
    'application/x-www-form-urlencoded',
  )
  if (!response.ok) throw await refused(response)
  return tokensOf(response, tokens.accountId)
}

/** One ask of the vendor: `undefined` while the person has not typed the code (its 403 and 404). */
async function askDeviceToken(pending: z.infer<typeof Pending>) {
  const response = await post(
    DEVICE_TOKEN_URL,
    JSON.stringify({ device_auth_id: pending.deviceAuthId, user_code: pending.userCode }),
    'application/json',
  )
  if (response.status === 403 || response.status === 404) {
    await response.body?.cancel()
    return undefined
  }
  if (!response.ok) throw await refused(response)
  return replyOf(response, GrantReply)
}

// A wrong or used code is the person's to fix; a timeout, a 408, a 429, a 5xx, no answer or a
// malformed reply is the vendor down (502).
function failureOf(error: unknown): Failure {
  const status = error instanceof SubscriptionRefusal ? error.status : undefined
  const refusedByVendor =
    error instanceof SubscriptionRefusal &&
    (status === undefined || (status < 500 && status !== 408 && status !== 429))
  const details = { provider: 'openai' }
  return refusedByVendor
    ? new Failure('MODEL_ACCOUNT_REFUSED', { details, cause: error })
    : new Failure('MODEL_ACCOUNT_UNAVAILABLE', { details, cause: error })
}

/**
 * The ChatGPT subscription's device-code sign-in (decision 0049's amendment): the vendor's ids are
 * what waits, sealed; each ask of the vendor is one poll, and the code trade gives `refresh`,
 * `access`, `expires` and `accountId`, sealed whole.
 */
export function codexSignIn(): DeviceSignInFlow {
  return {
    provider: ProviderId.parse('openai'),
    seconds: CODE_SECONDS,
    async start() {
      try {
        const pending = await startDeviceLogin()
        return {
          url: DEVICE_PAGE_URL,
          userCode: pending.userCode,
          retryMs: pending.retryMs,
          pending: Credential.parse(JSON.stringify(pending)),
        }
      } catch (error) {
        throw failureOf(error)
      }
    },
    async poll(sealed) {
      const pending = Pending.parse(JSON.parse(sealed.reveal()))
      try {
        const grant = await askDeviceToken(pending)
        if (grant === undefined) return { status: 'waiting', retryMs: pending.retryMs }
        const tokens = await exchange(grant)
        return { status: 'linked', credential: Credential.parse(JSON.stringify(tokens)) }
      } catch (error) {
        throw failureOf(error)
      }
    },
  }
}
