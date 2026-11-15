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

/** What a route counts: the total always, and the offset and limit when it sends them (a scan's `paging` has no offset). */
const Counts = z.looseObject({
  total: z.int().min(0),
  offset: z.number().optional(),
  limit: z.number().optional(),
})
type Counted = z.infer<typeof Counts>

/** The offset a route that counts at the top level keeps in `filters` (the questions search). */
const Filtered = z.looseObject({
  total: z.int().min(0),
  limit: z.number(),
  filters: z.looseObject({ offset: z.number() }),
})

/**
 * The counts of a page as the route sends them, the one reading `temMais` and `total` both come from:
 * `paging` (orders, claims, a scan's), or the top level (billing periods: `total`, `offset`, `limit`;
 * questions: `total`, `limit` and the offset in `filters`). A route that sends none says null.
 */
function countsOf(body: unknown): Counted | null {
  const nested = z.looseObject({ paging: Counts }).safeParse(body)
  if (nested.success) return nested.data.paging
  const filtered = Filtered.safeParse(body)
  if (filtered.success) return { ...filtered.data, offset: filtered.data.filters.offset }
  const flat = Counts.safeParse(body)
  return flat.success ? flat.data : null
}

/** Whether another page follows: null when the counts lack the offset or the limit. */
function moreOf(counts: Counted | null): boolean | null {
  if (counts?.offset === undefined || counts.limit === undefined) return null
  return counts.offset + counts.limit < counts.total
}

/**
 * A scan's answer carries a `scroll_id` (the cursor of the next page); it counts nothing, so the page
 * with no rows is the end and a page with rows has more. A body with no `scroll_id` is paged by its counts.
 */
function pagedOf(
  body: unknown,
  count: number,
  counts: Counted | null,
): Pick<Rows, 'temMais' | 'seguinte'> {
  const scroll = z.looseObject({ scroll_id: z.string().min(1).max(4000) }).safeParse(body)
  if (!scroll.success) return { temMais: moreOf(counts) }
  return count === 0 ? { temMais: false } : { temMais: true, seguinte: scroll.data.scroll_id }
}

type Built = { success: true; data: Rows } | { success: false; error: z.ZodError }

/**
 * A ready read: the envelope checked (the list under `list`, or the body itself when it is the list
 * or one object, read as a list of one), the paging, and every row as Mercado Livre sent it. 401
 * is an expired access token (the Hub renews once and repeats), 403 a permission the app lacks,
 * and a 206 is an order the API could not fill whole (`X-Content-Missing`): it says in its docs
 * that the rest usually suffices, so the rows are read and carry `parcial`.
 * Any other status is the kernel's table, except the one 404 a read declares in `emptyNotFound`
 * (the start of its `message`, with `error: "not_found"`): the seller has no data yet, so it reads
 * as an empty answer; any other 404 stays a refusal.
 */
export function rows({ list, emptyNotFound }: { list: string | null; emptyNotFound?: string }) {
  const NothingFound = z.looseObject({
    error: z.literal('not_found'),
    message: z.string().startsWith(emptyNotFound ?? ''),
  })
  const Found =
    list === null
      ? listOf(Row)
      : z
          .record(z.string(), z.unknown())
          .transform((body) => body[list])
          .pipe(listOf(Row))
  function build(body: unknown, parcial = false): Built {
    const parsed = Found.safeParse(body)
    if (!parsed.success) return { success: false, error: parsed.error }
    const linhas = parsed.data
    const counts = countsOf(body)
    return Rows.safeParse({
      linhas,
      ...pagedOf(body, linhas.length, counts),
      ...(counts === null ? {} : { total: counts.total }),
      ...(parcial ? { parcial } : {}),
    })
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
    if (
      emptyNotFound !== undefined &&
      answer.status === 404 &&
      NothingFound.safeParse(answer.body).success
    )
      return { kind: 'OK', value: { linhas: [], temMais: false }, empty: true }
    if (answer.status < 200 || answer.status >= 300) return failedBy(answer, native)
    const built = build(answer.body, answer.status === 206)
    return built.success
      ? { kind: 'OK', value: built.data }
      : { kind: 'UNREADABLE', native: { ...native, reason: shapeOf(built.error, answer.body) } }
  }
  return { output, answer }
}
