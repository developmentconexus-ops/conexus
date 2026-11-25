import { classifyProviderError } from '@mastra/core/error'
import { z } from 'zod'
import { causeChain } from '../../platform/failure.ts'
import { retryAfterMs } from '../../platform/retry-after.ts'

/** What a provider's refusal of one call means for its account (code C52, study D3). */
export type CallFailure =
  | { kind: 'limited'; until: Date; reason: LimitReason }
  | { kind: 'refused' }
  | { kind: 'missing' }
  | { kind: 'unknown'; status: number | null }

/** Why an account is out until its time: a rate limit, or its credit or usage cap spent (a 402, or a 400 or 429 that says so). */
type LimitReason = 'rate' | 'credit'

/** A failure that is the account's, which the queue answers with the next account. */
export type AccountFailure = Exclude<CallFailure, { kind: 'unknown' }>

// The provider's error as the AI SDK's APICallError carries it, wherever it sits in the cause chain.
const ProviderError = z.object({
  statusCode: z.number().int(),
  responseHeaders: z.record(z.string(), z.string()).optional(),
})

// Without the provider's time: 15 minutes for a rate limit, 6 hours for credit (founder, D3 A).
const LIMIT_MS = { 429: 15 * 60_000, 402: 6 * 60 * 60_000 } as const

function providerErrorOf(error: unknown) {
  for (const cause of causeChain(error)) {
    const parsed = ProviderError.safeParse(cause)
    if (parsed.success) return parsed.data
  }
  return undefined
}

const REASON = { 429: 'rate', 402: 'credit' } as const satisfies Record<
  keyof typeof LIMIT_MS,
  LimitReason
>

/**
 * Anthropic answers an exhausted credit balance or a workspace spend limit with a 400, and a usage
 * cap (the weekly limit) with a 429: Mastra reads which, and the queue treats it as the status that
 * means the same. A 429 is a rate limit unless Mastra reads a spent balance or cap in it.
 */
function statusOf(error: unknown, status: 400 | 429): number {
  const kind = classifyProviderError(error)
  if (kind === 'quota') return 402
  if (kind === 'rate_limited') return 429
  if (status === 429) return 429
  return kind === 'auth' ? 401 : 400
}

export function callFailureOf(error: unknown, now = Date.now()): CallFailure {
  const found = providerErrorOf(error)
  if (found === undefined) return { kind: 'unknown', status: null }
  const { statusCode } = found
  const status = statusCode === 400 || statusCode === 429 ? statusOf(error, statusCode) : statusCode
  if (status === 429 || status === 402) {
    const after = retryAfterMs(found.responseHeaders ?? {}, now)
    return {
      kind: 'limited',
      until: new Date(now + (after ?? LIMIT_MS[status])),
      reason: REASON[status],
    }
  }
  if (status === 401 || status === 403) return { kind: 'refused' }
  // The provider does not know the model for this credential: the list it serves has changed.
  if (status === 404) return { kind: 'missing' }
  return { kind: 'unknown', status }
}
