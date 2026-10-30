import { z } from 'zod'
import type { Answered, Failure, Native, ProviderAnswer } from '../kernel/operation.ts'
import { outcomeOf, shapeOf } from '../kernel/operation.ts'
import type { Rows } from './operations/shared.ts'
import { listOf } from './operations/shared.ts'

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
  // A 2xx body is the company's data: it never rides along on an unreadable answer, and its
  // "Consulta realizada com sucesso!" does not sit under a failure.
  return ok
    ? { status: answer.status, code: null, message: null, body: null }
    : { status: answer.status, ...locate(answer.body), body: answer.body }
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

/**
 * The 404 every REST list sends for a page with no rows, an empty list or a page past the end
 * (measured on every route, 2026-10-30): any other 404, such as a moved route's own, stays the kernel's.
 */
const NothingFound = z.looseObject({
  statusCode: z.literal(404),
  error: z.looseObject({
    code: z.literal('RESOURCE_NOT_FOUND'),
    details: z.string().startsWith('Nenhum registro da entidade'),
  }),
})

function read<O>(output: z.ZodType<O>, answer: ProviderAnswer, body: unknown): Answered<O> {
  const parsed = output.safeParse(body)
  return parsed.success
    ? { kind: 'OK', value: parsed.data }
    : { kind: 'UNREADABLE', native: { ...nativeOf(answer), reason: shapeOf(parsed.error, body) } }
}

const HasMore = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((text) => text === 'true'),
])

/** Where the routes say another page follows: `pagination.hasMore` (text or boolean), or the prices' `temMaisRegistros`. */
const Paging = z.object({
  pagination: z.object({ hasMore: HasMore.optional() }).optional(),
  temMaisRegistros: z.boolean().optional(),
})

/**
 * A ready read: the envelope checked (the list under `list`, one object read as a list of one, and
 * the paging), every row as Sankhya sent it. The measured empty 404 is a page with no rows; any
 * other answer outside 2xx is the refusal its status says.
 */
export function rows({ list }: { list: string }) {
  // Two objects that each keep only their own keys, so the intersection never meets one key twice.
  const List = z.object({ [list]: listOf(z.record(z.string(), z.unknown())) })
  const output = List.and(Paging).transform(
    (body): Rows => ({
      linhas: body[list] ?? [],
      temMais: body.pagination?.hasMore ?? body.temMaisRegistros ?? null,
    }),
  )
  function answer(answer: ProviderAnswer): Answered<Rows> {
    if (answer.status === 404 && NothingFound.safeParse(answer.body).success)
      return { kind: 'OK', value: { linhas: [], temMais: false } }
    return failureOf(answer) ?? read(output, answer, answer.body)
  }
  return { output, answer }
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
  if (!envelope.success)
    return {
      kind: 'UNREADABLE',
      native: { ...nativeOf(answer), reason: shapeOf(envelope.error, answer.body) },
    }
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
