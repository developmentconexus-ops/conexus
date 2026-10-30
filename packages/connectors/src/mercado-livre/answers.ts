import { z } from 'zod'
import type { Answered, Native, ProviderAnswer } from '../kernel/operation.ts'
import { failedBy, locateOf, shapeOf } from '../kernel/operation.ts'
import { listOf, Rows } from '../kernel/rows.ts'

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

/** A row is an object; a list of ids (the listing search) gives each id as `{ id }`. */
const Row = z.union([
  z.record(z.string(), z.unknown()),
  z.union([z.string(), z.number()]).transform((id) => ({ id })),
])

const Counts = z.looseObject({ total: z.number(), offset: z.number(), limit: z.number() })

/** The offset a route that counts at the top level keeps in `filters` (the questions search). */
const Filtered = z.looseObject({
  total: z.number(),
  limit: z.number(),
  filters: z.looseObject({ offset: z.number() }),
})

/**
 * Whether another page follows, from the counts as the route sends them: `paging` (orders, claims),
 * or the top level (billing periods: `total`, `offset`, `limit`; questions: `total`, `limit` and
 * the offset in `filters`). A route that sends none says null.
 */
function moreOf(body: unknown): boolean | null {
  const nested = z.looseObject({ paging: Counts }).safeParse(body)
  const flat = Counts.safeParse(body)
  const filtered = Filtered.safeParse(body)
  const counts = nested.success
    ? nested.data.paging
    : flat.success
      ? flat.data
      : filtered.success
        ? {
            total: filtered.data.total,
            limit: filtered.data.limit,
            offset: filtered.data.filters.offset,
          }
        : null
  return counts === null ? null : counts.offset + counts.limit < counts.total
}

/** The row without the keys named by dotted path (`buyer`, `from.email`): the buyer's personal data never leaves the kit. */
function without(value: unknown, path: readonly string[]): unknown {
  const [key, ...rest] = path
  if (key === undefined || typeof value !== 'object' || value === null || Array.isArray(value))
    return value
  if (rest.length === 0) return Object.fromEntries(Object.entries(value).filter(([k]) => k !== key))
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, k === key ? without(v, rest) : v]),
  )
}

type Built = { success: true; data: Rows } | { success: false; error: z.ZodError }

/**
 * A ready read: the envelope checked (the list under `list`, or the body itself when it is the list
 * or one object, read as a list of one), the paging, and every row as Mercado Livre sent it minus
 * the `omit` keys. 401 is an expired access token (the Hub renews once and repeats), 403 a
 * permission the app lacks, and a 206 is a partial answer (`X-Content-Missing` on orders):
 * unreadable, never a shorter list. Any other status is the kernel's table.
 */
export function rows({ list, omit = [] }: { list: string | null; omit?: readonly string[] }) {
  const Found =
    list === null
      ? listOf(Row)
      : z
          .record(z.string(), z.unknown())
          .transform((body) => body[list])
          .pipe(listOf(Row))
  function build(body: unknown): Built {
    const parsed = Found.safeParse(body)
    if (!parsed.success) return { success: false, error: parsed.error }
    const linhas = parsed.data.map((row) =>
      omit.reduce<unknown>((kept, path) => without(kept, path.split('.')), row),
    )
    return Rows.safeParse({ linhas, temMais: moreOf(body) })
  }
  const output = z.unknown().transform((body, context): Rows => {
    const built = build(body)
    if (built.success) return built.data
    for (const issue of built.error.issues)
      context.issues.push({ code: 'custom', message: issue.message, path: issue.path, input: body })
    return z.NEVER
  })
  function answer(answer: ProviderAnswer): Answered<Rows> {
    const native = nativeOf(answer)
    if (answer.status === 401) return { kind: 'TOKEN_EXPIRED', native }
    if (answer.status === 403) return { kind: 'REFUSED', native }
    if (answer.status === 206) return { kind: 'UNREADABLE', native }
    if (answer.status < 200 || answer.status >= 300) return failedBy(answer, native)
    const built = build(answer.body)
    return built.success
      ? { kind: 'OK', value: built.data }
      : { kind: 'UNREADABLE', native: { ...native, reason: shapeOf(built.error, answer.body) } }
  }
  return { output, answer }
}
