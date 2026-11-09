import { z } from 'zod'
import type { Answered, Failure, Native, ProviderAnswer } from '../kernel/operation.ts'
import { failedBy, shapeOf } from '../kernel/operation.ts'
import type { Rows } from '../kernel/rows.ts'
import { CONCURRENT_CALL, listOf } from '../kernel/rows.ts'

const Text = z.union([z.string(), z.number()])
const Refusal = z.looseObject({
  code: Text.optional(),
  mensagem: z
    .union([
      z.string(),
      z.looseObject({
        codigo: Text.optional(),
        descricao: z.string().optional(),
        code: Text.optional(),
        message: z.string().optional(),
        details: z.string().optional(),
      }),
    ])
    .optional(),
  message: z.string().optional(),
  error: z
    .union([
      z.string(),
      z.looseObject({
        code: Text.optional(),
        message: z.string().optional(),
        details: z.string().optional(),
      }),
    ])
    .optional(),
})

/** An add's 400 keeps the cause in `details` ("O produto [9554] enviado não existe."), after the generic `message`; the same text is said once. */
function detailed(object: { message?: string; details?: string } | undefined): string | undefined {
  const text = new Set([object?.message, object?.details].filter((part) => part !== undefined))
  return text.size === 0 ? undefined : [...text].join(' ')
}

/**
 * Where a refused call keeps its code and message: `code`, the `mensagem.codigo` six pages document,
 * the gateway's `error.code`, or a message that starts with `GTW`; the message is the first of `message`, `mensagem` and `error`.
 */
function locate(body: unknown): Pick<Native, 'code' | 'message'> {
  const parsed = Refusal.safeParse(body)
  if (!parsed.success) return { code: null, message: null }
  const { code, mensagem, message, error } = parsed.data
  const text = [
    message,
    typeof mensagem === 'string' ? mensagem : (mensagem?.descricao ?? detailed(mensagem)),
    typeof error === 'string' ? error : detailed(error),
  ].find((value) => value !== undefined)
  const given =
    code ??
    (typeof mensagem === 'object' ? (mensagem.codigo ?? mensagem.code) : undefined) ??
    (typeof error === 'object' ? error.code : undefined) ??
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
  // Every read carries the bearer, so a 401 is a token ended early (logged out): the keys are judged at the login.
  if (status === 401 || (status === 403 && native.code === 'GTW3403'))
    return { kind: 'TOKEN_EXPIRED', native }
  if (status === 403 && (native.code === '4303' || native.code === '4405'))
    return { kind: 'AUTH_REFUSED', native }
  return failedBy(answer, native)
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
      return { kind: 'OK', value: { linhas: [], temMais: false }, empty: true }
    const result = failureOf(answer) ?? read(output, answer, answer.body)
    return result.kind === 'OK' && result.value.linhas.length === 0
      ? { ...result, empty: true }
      : result
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
  // "4": a second call on the token while one was open. Ours, never repeated, so the Hub sees it by this code (#470).
  if (status === '4')
    return {
      kind: 'UNREADABLE',
      native: {
        status: answer.status,
        code: CONCURRENT_CALL,
        message: statusMessage ?? null,
        body: answer.body,
      },
    }
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

const Created = z.looseObject({
  mensagem: z.string().optional(),
})

/** The page declares `type: integer`, but this gateway sends numbers as text in its reads, so the add's id counts as an integer or as plain digits without a leading zero. */
const CodigoPedido = z.union([
  z.number().int().positive(),
  z
    .string()
    .regex(/^[1-9]\d{0,14}$/)
    .transform(Number),
])

/** The add's success: only a readable `retorno.codigoPedido` counts, and never beside a `[CORE_E…]` in the message. */
const Placed = z
  .object({ retorno: z.object({ codigoPedido: CodigoPedido }) })
  .transform(({ retorno }) => ({ codigoPedido: retorno.codigoPedido }))

/**
 * An order's add: a refusal outside 2xx as the reads see it, and a 2xx with a `[CORE_E…]` in its
 * message is the vendor's refusal too. Only that proves a refusal: any other 2xx that does not
 * carry a readable `retorno.codigoPedido` (no object, no `retorno`, another shape) is unreadable,
 * since the order may exist.
 */
export function placed() {
  function answer(answer: ProviderAnswer): Answered<z.infer<typeof Placed>> {
    const failure = failureOf(answer)
    if (failure) return failure
    const body = Created.safeParse(answer.body)
    if (!body.success)
      return {
        kind: 'UNREADABLE',
        native: { ...nativeOf(answer), reason: shapeOf(body.error, answer.body) },
      }
    const { mensagem } = body.data
    if (mensagem?.includes('[CORE_E'))
      return {
        kind: 'REFUSED',
        native: {
          status: answer.status,
          code: mensagem?.match(/CORE_E\d+/)?.[0] ?? null,
          message: mensagem ?? null,
          body: answer.body,
        },
      }
    const created = Placed.safeParse(body.data)
    // A 2xx that does not read is a success we cannot read, never a refusal: the order may exist.
    return created.success
      ? { kind: 'OK', value: created.data }
      : {
          kind: 'UNREADABLE',
          native: { ...nativeOf(answer), reason: shapeOf(created.error, answer.body) },
        }
  }
  return { output: Placed, answer }
}
