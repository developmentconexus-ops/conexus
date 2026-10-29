import { z } from 'zod'
import type { Answered, Failure, Native, ProviderAnswer } from '../kernel/operation.ts'
import { outcomeOf } from '../kernel/operation.ts'

const Text = z.union([z.string(), z.number()])
const Refusal = z.looseObject({
  code: Text.optional(),
  mensagem: z
    .union([
      z.string(),
      z.looseObject({ codigo: Text.optional(), descricao: z.string().optional() }),
    ])
    .optional(),
  message: z.string().optional(),
  error: z.union([z.string(), z.looseObject({ message: z.string().optional() })]).optional(),
})

/**
 * Where a refused call keeps its code and message: `code`, the `mensagem.codigo` six pages document,
 * or a message that starts with `GTW`; the message is the first of `message`, `mensagem` and `error`.
 */
function locate(body: unknown): Pick<Native, 'code' | 'message'> {
  const parsed = Refusal.safeParse(body)
  if (!parsed.success) return { code: null, message: null }
  const { code, mensagem, message, error } = parsed.data
  const text = [
    message,
    typeof mensagem === 'string' ? mensagem : mensagem?.descricao,
    typeof error === 'string' ? error : error?.message,
  ].find((value) => value !== undefined)
  const given =
    code ??
    (typeof mensagem === 'object' ? mensagem.codigo : undefined) ??
    text?.match(/^GTW\d+/)?.[0]
  return { code: given === undefined ? null : String(given), message: text ?? null }
}

function nativeOf(answer: ProviderAnswer): Native {
  const ok = answer.status >= 200 && answer.status < 300
  // A 2xx body is the company's data: it never rides along on an unreadable answer.
  return { status: answer.status, ...locate(answer.body), body: ok ? null : answer.body }
}

/** A status outside 2xx: the Sankhya codes the pages document, else the kernel's table; null for a 2xx. */
function failureOf(answer: ProviderAnswer): Failure | null {
  const { status } = answer
  if (status >= 200 && status < 300) return null
  const native = nativeOf(answer)
  if (status === 403 && native.code === 'GTW3403') return { kind: 'TOKEN_EXPIRED', native }
  if (status === 403 && (native.code === '4303' || native.code === '4405'))
    return { kind: 'AUTH_REFUSED', native }
  return { kind: outcomeOf(status), native }
}

/** What the six pages say a 404 means; `spec.test.ts` checks each page still says it. */
export const NOT_FOUND = 'Dados não encontrados'

/**
 * The 404 body the kit expects: the message must be the pages' phrase, or a moved route (the framework's own 404) would read as an empty list.
 * The six pages show the phrase only as the 404 response's description; this body shape is unmeasured and is set from the founder's use script (step 3) with a real empty 404.
 */
const NotFound = z.looseObject({
  statusCode: z.literal(404),
  error: z.looseObject({ message: z.literal(NOT_FOUND) }),
})

function read<O>(output: z.ZodType<O>, answer: ProviderAnswer, body: unknown): Answered<O> {
  const parsed = output.safeParse(body)
  return parsed.success
    ? { kind: 'OK', value: parsed.data }
    : { kind: 'UNREADABLE', native: nativeOf(answer) }
}

/**
 * The REST answer: the body in the operation's schema, or the failure its status says. A 404 is a
 * list only when its body says so: the list itself, or (for the reads whose page documents it) the
 * not-found body the kit expects (NotFound), which reads as `empty`, the list with no rows; any
 * other 404 is the kernel's.
 */
export function restAnswer<O>(
  answer: ProviderAnswer,
  output: z.ZodType<O>,
  empty?: unknown,
): Answered<O> {
  if (answer.status === 404 && empty !== undefined && NotFound.safeParse(answer.body).success)
    return read(output, answer, empty)
  const listed = answer.status === 404 ? read(output, answer, answer.body) : null
  if (listed?.kind === 'OK') return listed
  return failureOf(answer) ?? read(output, answer, answer.body)
}

const Envelope = z.looseObject({
  status: z.string(),
  statusMessage: z.string().optional(),
  responseBody: z.unknown().optional(),
})

/** The gateway answer: HTTP failures as the REST ones; then the envelope, where `status` other than "1" and a `[CORE_E…]` in its message are the vendor's refusal (never searched across the rows). */
export function gatewayAnswer<O>(answer: ProviderAnswer, responseBody: z.ZodType<O>): Answered<O> {
  const failure = failureOf(answer)
  if (failure) return failure
  const envelope = Envelope.safeParse(answer.body)
  if (!envelope.success) return { kind: 'UNREADABLE', native: nativeOf(answer) }
  const { status, statusMessage } = envelope.data
  const rule = statusMessage?.match(/CORE_E\d+/)?.[0]
  if (status !== '1' || statusMessage?.includes('[CORE_E'))
    // The vendor's own refusal, envelope and all: the body goes only to the Testar and the Builder, which already read company data.
    return {
      kind: 'REFUSED',
      native: {
        status: answer.status,
        code: rule ?? status,
        message: statusMessage ?? null,
        body: answer.body,
      },
    }
  return read(responseBody, answer, envelope.data.responseBody)
}
