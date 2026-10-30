import type { z } from 'zod'
import type { Answered, Native, ProviderAnswer } from '../kernel/operation.ts'
import { locateOf, outcomeOf } from '../kernel/operation.ts'

/** Where a refusal keeps its code: `code` (the permission policies), else the `error` the API names; the message is `message`. */
function nativeOf(answer: ProviderAnswer): Native {
  const ok = answer.status >= 200 && answer.status < 300
  const located = locateOf(answer.body)
  const error =
    typeof answer.body === 'object' && answer.body !== null && 'error' in answer.body
      ? answer.body.error
      : null
  return {
    status: answer.status,
    code: located.code ?? (typeof error === 'string' ? error : null),
    message: located.message,
    // A 2xx body is the seller's data: it never rides along on an unreadable answer.
    body: ok ? null : answer.body,
  }
}

/**
 * The read's answer. 401 is an expired access token (the Hub renews once and repeats), 403 a
 * permission the app lacks. A 206 is a partial answer (`X-Content-Missing` on orders): it is
 * unreadable, never a shorter list. Any other status is the kernel's table.
 */
export function mlAnswer<O>(answer: ProviderAnswer, output: z.ZodType<O>): Answered<O> {
  const native = nativeOf(answer)
  if (answer.status === 401) return { kind: 'TOKEN_EXPIRED', native }
  if (answer.status === 403) return { kind: 'REFUSED', native }
  if (answer.status === 206) return { kind: 'UNREADABLE', native }
  if (answer.status < 200 || answer.status >= 300) return { kind: outcomeOf(answer.status), native }
  const parsed = output.safeParse(answer.body)
  return parsed.success ? { kind: 'OK', value: parsed.data } : { kind: 'UNREADABLE', native }
}
