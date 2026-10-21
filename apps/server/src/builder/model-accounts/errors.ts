import { z } from 'zod'
import { causeChain } from '../../platform/failure.ts'

/** What a provider's refusal of one call means for its account (code C52, study D3). */
export type CallFailure =
  | { kind: 'limited'; until: Date }
  | { kind: 'refused' }
  | { kind: 'missing' }
  | { kind: 'unknown'; status: number | null }

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

/**
 * The provider's own time, `retry-after-ms` before `retry-after` in seconds or as a date; Mastra's
 * reader (`utils/retry-after.ts`) is not exported, so the header is read here (code C75).
 */
function retryAfterMs(headers: Record<string, string>, now: number): number | undefined {
  const lower = new Map(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]))
  const ms = lower.get('retry-after-ms')
  if (ms !== undefined && /^\d+$/.test(ms)) return Number(ms)
  const after = lower.get('retry-after')
  if (after === undefined) return undefined
  if (/^\d+$/.test(after)) return Number(after) * 1000
  const date = Date.parse(after)
  return Number.isNaN(date) || date <= now ? undefined : date - now
}

export function callFailureOf(error: unknown, now = Date.now()): CallFailure {
  const found = providerErrorOf(error)
  if (found === undefined) return { kind: 'unknown', status: null }
  const status = found.statusCode
  if (status === 429 || status === 402) {
    const after = retryAfterMs(found.responseHeaders ?? {}, now) ?? LIMIT_MS[status]
    return { kind: 'limited', until: new Date(now + after) }
  }
  if (status === 401 || status === 403) return { kind: 'refused' }
  // The provider does not know the model for this credential: the list it serves has changed.
  if (status === 404) return { kind: 'missing' }
  return { kind: 'unknown', status }
}
