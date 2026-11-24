import { z } from 'zod'
import type { Answered, Failure, Native, ProviderAnswer } from '../kernel/operation.ts'
import { failedBy, shapeOf } from '../kernel/operation.ts'
import type { Rows } from '../kernel/rows.ts'
import { CONCURRENT_CALL, listOf } from '../kernel/rows.ts'

const Code = z.union([z.string(), z.number()])

/** What a refusal says in an object: six pages document `{ codigo, descricao }`; the gateway sends `{ code, message, details }`. */
const Said = z.union([
  z.string(),
  z.looseObject({
    codigo: Code.optional(),
    descricao: z.string().optional(),
    code: Code.optional(),
    message: z.string().optional(),
    details: z.string().optional(),
  }),
])
type Said = z.infer<typeof Said>

const RefusalBody = z.looseObject({
  code: Code.optional(),
  message: z.string().optional(),
  mensagem: Said.optional(),
  error: Said.optional(),
})

/** The text of what was said; an add's 400 keeps its cause in `details`, after a generic `message`, and a cause that repeats it is said once. */
function textOf(said: Said | undefined): string | undefined {
  if (said === undefined || typeof said === 'string') return said
  if (said.descricao !== undefined) return said.descricao
  const parts = new Set([said.message, said.details].filter((part) => part !== undefined))
  return parts.size === 0 ? undefined : [...parts].join(' ')
}

function codeOf(said: Said | undefined): string | number | undefined {
  return typeof said === 'object' ? (said.codigo ?? said.code) : undefined
}

/** The code and the message of a refused call: the first that says one, top level, then `mensagem`, then `error`; else a message's leading `GTW` code. */
function located(body: unknown): Pick<Native, 'code' | 'message'> {
  const parsed = RefusalBody.safeParse(body)
  if (!parsed.success) return { code: null, message: null }
  const { code, message, mensagem, error } = parsed.data
  const text = message ?? textOf(mensagem) ?? textOf(error)
  const given = code ?? codeOf(mensagem) ?? codeOf(error) ?? text?.match(/^GTW\d+/)?.[0]
  return { code: given === undefined ? null : String(given), message: text ?? null }
}

/** A 2xx the kit could not read: why, and never its body, which may carry the company's data or a success phrase. */
function unreadable(answer: ProviderAnswer, error: z.ZodError, body: unknown): Failure {
  const native = { status: answer.status, code: null, message: null, body: null }
  return { kind: 'UNREADABLE', native: { ...native, reason: shapeOf(error, body) } }
}

/** A status outside 2xx, with what Sankhya said; null for a 2xx. */
function failureOf(answer: ProviderAnswer): Failure | null {
  if (answer.status >= 200 && answer.status < 300) return null
  const native: Native = { status: answer.status, ...located(answer.body), body: answer.body }
  // Every call carries the bearer, so a 401 is a token ended early (logged out); the keys are judged at the login.
  if (answer.status === 401 || (answer.status === 403 && native.code === 'GTW3403'))
    return { kind: 'TOKEN_EXPIRED', native }
  if (answer.status === 403 && (native.code === '4303' || native.code === '4405'))
    return { kind: 'AUTH_REFUSED', native }
  return failedBy(answer, native)
}

function parsed<O>(output: z.ZodType<O>, answer: ProviderAnswer, body: unknown): Answered<O> {
  const read = output.safeParse(body)
  return read.success ? { kind: 'OK', value: read.data } : unreadable(answer, read.error, body)
}

function markedEmpty<O extends { linhas: readonly unknown[] }>(result: Answered<O>): Answered<O> {
  return result.kind === 'OK' && result.value.linhas.length === 0
    ? { ...result, empty: true }
    : result
}

/** The 404 every REST list sends for a page with no rows (measured on every route, 2026-10-30); a moved route's 404 is another. */
const NoRows = z.looseObject({
  statusCode: z.literal(404),
  error: z.looseObject({
    code: z.literal('RESOURCE_NOT_FOUND'),
    details: z.string().startsWith('Nenhum registro da entidade'),
  }),
})

const Bool = z.union([z.boolean(), z.enum(['true', 'false']).transform((text) => text === 'true')])

/** Where a route says another page follows: `pagination.hasMore`, or the prices' `temMaisRegistros`. */
const Paging = z.object({
  pagination: z.object({ hasMore: Bool.optional() }).optional(),
  temMaisRegistros: z.boolean().optional(),
})

/** A REST list read: the rows under `key` as Sankhya sent them (one object is a list of one), and whether another page follows. */
export function restRows(key: string) {
  const output = z
    .object({ [key]: listOf(z.record(z.string(), z.unknown())) })
    .and(Paging)
    .transform(
      (body): Rows => ({
        linhas: body[key] ?? [],
        temMais: body.pagination?.hasMore ?? body.temMaisRegistros ?? null,
      }),
    )
  function answer(answered: ProviderAnswer): Answered<Rows> {
    if (answered.status === 404 && NoRows.safeParse(answered.body).success)
      return { kind: 'OK', value: { linhas: [], temMais: false }, empty: true }
    return markedEmpty(failureOf(answered) ?? parsed(output, answered, answered.body))
  }
  return { output, answer }
}

const Envelope = z.looseObject({
  status: z.string(),
  statusMessage: z.string().optional(),
  responseBody: z.unknown().optional(),
})

/**
 * A gateway service's answer: a status outside 2xx as the REST reads read it, then the envelope. Its
 * status "4" is a second call on one token, our fault (#470); any status but "1", or a `[CORE_E…]` in
 * its message (never in the rows, which the company wrote), is Sankhya's refusal.
 */
export function gatewayAnswer<O>(answer: ProviderAnswer, responseBody: z.ZodType<O>): Answered<O> {
  const failure = failureOf(answer)
  if (failure) return failure
  const envelope = Envelope.safeParse(answer.body)
  if (!envelope.success) return unreadable(answer, envelope.error, answer.body)
  const { status, statusMessage } = envelope.data
  const message = statusMessage ?? null
  if (status === '4')
    return {
      kind: 'UNREADABLE',
      native: { status: answer.status, code: CONCURRENT_CALL, message, body: answer.body },
    }
  if (status !== '1' || statusMessage?.includes('[CORE_E')) {
    const code = statusMessage?.match(/CORE_E\d+/)?.[0] ?? status
    return { kind: 'REFUSED', native: { status: answer.status, code, message, body: answer.body } }
  }
  return parsed(responseBody, answer, envelope.data.responseBody)
}

/** A search's answer: the gateway's, with nothing to look at marked. */
export function foundAnswer<O extends { linhas: readonly unknown[] }>(
  answer: ProviderAnswer,
  found: z.ZodType<O>,
): Answered<O> {
  return markedEmpty(gatewayAnswer(answer, found))
}

/** The add's success: an integer `retorno.codigoPedido` (the page declares `type: integer`). */
export const Placed = z
  .object({ retorno: z.object({ codigoPedido: z.number().int().positive() }) })
  .transform(({ retorno }) => ({ codigoPedido: retorno.codigoPedido }))

const Added = z.looseObject({ mensagem: z.string().optional() })

/**
 * An order's add. A `[CORE_E…]` in a 2xx's message is Sankhya's refusal; any other 2xx without an
 * integer `retorno.codigoPedido` is unreadable, never a refusal, since the order may exist.
 */
export function placedAnswer(answer: ProviderAnswer): Answered<z.infer<typeof Placed>> {
  const failure = failureOf(answer)
  if (failure) return failure
  const added = Added.safeParse(answer.body)
  if (!added.success) return unreadable(answer, added.error, answer.body)
  const { mensagem } = added.data
  if (mensagem?.includes('[CORE_E')) {
    const code = mensagem.match(/CORE_E\d+/)?.[0] ?? null
    return {
      kind: 'REFUSED',
      native: { status: answer.status, code, message: mensagem, body: answer.body },
    }
  }
  return parsed(Placed, answer, answer.body)
}
