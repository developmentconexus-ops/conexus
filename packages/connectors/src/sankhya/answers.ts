import { z } from 'zod'
import type { Answered, ProviderAnswer } from '../kernel/operation.ts'

const Text = z.union([z.string(), z.number()])
const Refusal = z.looseObject({
  code: Text.optional(),
  mensagem: z.union([z.string(), z.looseObject({ codigo: Text.optional() })]).optional(),
  message: z.string().optional(),
  error: z.string().optional(),
})

/**
 * The gateway code of a refused call, read from a loose body: `code`, the `mensagem.codigo` six
 * pages document, or a message that starts with `GTW`. It never leaves the kit.
 */
function errorCode(body: unknown): string | null {
  const parsed = Refusal.safeParse(body)
  if (!parsed.success) return null
  const { code, mensagem, message, error } = parsed.data
  if (code !== undefined) return String(code)
  if (typeof mensagem === 'object' && mensagem.codigo !== undefined) return String(mensagem.codigo)
  const text = [message, typeof mensagem === 'string' ? mensagem : undefined, error].find((value) =>
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

/** What the six pages say a 404 means; `spec.test.ts` checks each page still says it. */
export const NOT_FOUND = 'Dados não encontrados'

/**
 * The 404 body six pages document: the message must be theirs, or a moved route (the framework's own 404) would read as an empty list.
 * The pages show the phrase as the 404 response's description; this body shape is unmeasured and is set from the founder's use script (step 3) with a real empty 404.
 */
const NotFound = z.looseObject({
  statusCode: z.literal(404),
  error: z.looseObject({ message: z.literal(NOT_FOUND) }),
})

function read<O>(output: z.ZodType<O>, body: unknown): Answered<O> {
  const parsed = output.safeParse(body)
  return parsed.success ? { kind: 'OK', value: parsed.data } : { kind: 'UNREADABLE' }
}

/**
 * The REST answer: the body in the operation's schema, or the refusal its status says. A 404 is a
 * list only when its body says so: the list itself, or (for the reads whose page documents it) the
 * documented not-found body, which reads as `empty`, the list with no rows.
 */
export function restAnswer<O>(
  answer: ProviderAnswer,
  output: z.ZodType<O>,
  empty?: unknown,
): Answered<O> {
  if (answer.status === 404 && empty !== undefined && NotFound.safeParse(answer.body).success)
    return read(output, empty)
  const refusal = answer.status === 404 ? null : refusalOf(answer)
  return refusal ?? read(output, answer.body)
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
