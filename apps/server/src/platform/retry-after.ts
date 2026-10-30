/**
 * The provider's own wait, `retry-after-ms` before `retry-after` in seconds or as a date; Mastra's
 * reader (`utils/retry-after.ts`) is not exported, so the header is read here (code C75). Model
 * accounts and the connector executor both read it.
 */
export function retryAfterMs(headers: Record<string, string>, now: number): number | undefined {
  const lower = new Map(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]))
  const ms = lower.get('retry-after-ms')
  if (ms !== undefined && /^\d+$/.test(ms)) return Number(ms)
  const after = lower.get('retry-after')
  if (after === undefined) return undefined
  if (/^\d+$/.test(after)) return Number(after) * 1000
  const date = Date.parse(after)
  return Number.isNaN(date) || date <= now ? undefined : date - now
}
