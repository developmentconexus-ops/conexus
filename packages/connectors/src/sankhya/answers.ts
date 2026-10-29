import { z } from 'zod'
import type { Answered, ProviderAnswer } from '../kernel/operation.ts'

/** The gateway code of a refused call, read from a loose body (`code`, or a message that starts with `GTW`); never leaves the kit. */
function errorCode(body: unknown): string | null {
  const loose = z
    .looseObject({ code: z.union([z.string(), z.number()]).optional() })
    .safeParse(body)
  if (loose.success && loose.data.code !== undefined) return String(loose.data.code)
  const message = z
    .looseObject({
      message: z.string().optional(),
      mensagem: z.string().optional(),
      error: z.string().optional(),
    })
    .safeParse(body)
  if (!message.success) return null
  const text = [message.data.message, message.data.mensagem, message.data.error].find((value) =>
    value?.startsWith('GTW'),
  )
  return text?.match(/^GTW\d+/)?.[0] ?? null
}

/** What a status outside 2xx means to the caller; null for a 2xx. 5xx is the executor's (UNREACHABLE) and is unreadable here. */
function refusalOf(answer: ProviderAnswer): Answered<never> | null {
  const { status } = answer
  if (status >= 200 && status < 300) return null
  if (status === 400) return { kind: 'REFUSED', reason: 'INPUT' }
  if (status === 401) return { kind: 'AUTH_REFUSED' }
  if (status === 403) {
    const code = errorCode(answer.body)
    if (code === 'GTW3403') return { kind: 'TOKEN_EXPIRED' }
    if (code === '4303' || code === '4405') return { kind: 'AUTH_REFUSED' }
    return { kind: 'REFUSED', reason: 'NO_PERMISSION' }
  }
  return { kind: 'UNREADABLE' }
}

/** The REST answer: the body in the operation's schema, or the refusal its status says. A 404 is a list only when its body says so. */
export function restAnswer<O>(answer: ProviderAnswer, output: z.ZodType<O>): Answered<O> {
  const refusal = answer.status === 404 ? null : refusalOf(answer)
  if (refusal) return refusal
  const parsed = output.safeParse(answer.body)
  return parsed.success ? { kind: 'OK', value: parsed.data } : { kind: 'UNREADABLE' }
}

const Envelope = z.looseObject({ status: z.string(), responseBody: z.unknown().optional() })

/** The gateway answer: HTTP refusals as the REST ones; then the envelope, where `status` other than "1" and a `[CORE_E…]` message are the vendor's refusal. */
export function gatewayAnswer<O>(answer: ProviderAnswer, responseBody: z.ZodType<O>): Answered<O> {
  const refusal = refusalOf(answer)
  if (refusal) return refusal
  const envelope = Envelope.safeParse(answer.body)
  if (!envelope.success) return { kind: 'UNREADABLE' }
  if (envelope.data.status !== '1' || JSON.stringify(answer.body).includes('[CORE_E'))
    return { kind: 'REFUSED', reason: 'VENDOR' }
  const parsed = responseBody.safeParse(envelope.data.responseBody)
  return parsed.success ? { kind: 'OK', value: parsed.data } : { kind: 'UNREADABLE' }
}
