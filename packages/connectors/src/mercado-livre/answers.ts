import { z } from 'zod'
import type { Answered, Native, ProviderAnswer } from '../kernel/operation.ts'
import { failedBy, locateOf, shapeOf } from '../kernel/operation.ts'
import { listOf, Rows } from '../kernel/rows.ts'

function nativeOf(answer: ProviderAnswer): Native {
  const located = locateOf(answer.body)
  const error = z.looseObject({ error: z.string() }).safeParse(answer.body).data?.error
  return {
    status: answer.status,
    code: located.code ?? error ?? null,
    message: located.message,
    // A 2xx body is the seller's data: it never rides along on an unreadable answer.
    body: answer.status >= 200 && answer.status < 300 ? null : answer.body,
  }
}

const Row = z.union([
  z.record(z.string(), z.unknown()),
  z.union([z.string(), z.number()]).transform((id) => ({ id })),
])

const Counts = z.looseObject({
  total: z.int().min(0),
  offset: z.number().optional(),
  limit: z.number().optional(),
})

/**
 * What a page counts, where the route keeps it: under `paging` (orders, claims, a scan), at the top
 * (billing periods), or with the offset inside `filters` (questions). A route that sends none has none.
 */
const Paging = z.union([
  z.looseObject({ paging: Counts }).transform((body) => body.paging),
  z
    .looseObject({
      total: z.int().min(0),
      limit: z.number(),
      filters: z.looseObject({ offset: z.number() }),
    })
    .transform(({ total, limit, filters }) => ({
      total,
      limit,
      offset: filters.offset,
    })),
  Counts,
])
type Paging = z.infer<typeof Paging>

const Scroll = z.looseObject({ scroll_id: z.string().min(1).max(4000) })

/** A scan counts nothing: its page with rows has more and its page with none is the end. */
function moreOf(
  body: unknown,
  count: number,
  paging: Paging | null,
): Pick<Rows, 'temMais' | 'seguinte'> {
  const scroll = Scroll.safeParse(body)
  if (scroll.success)
    return count === 0 ? { temMais: false } : { temMais: true, seguinte: scroll.data.scroll_id }
  if (paging?.offset === undefined || paging.limit === undefined) return { temMais: null }
  return { temMais: paging.offset + paging.limit < paging.total }
}

type Built = { success: true; data: Rows } | { success: false; error: z.ZodError }

/** A 206 is an order the API could not fill whole (`X-Content-Missing`): its rows are read and carry `parcial`. The 404 `emptyNotFound` names is a seller with no data yet, an empty answer. */
export function rowsAnswer({
  rowsAt,
  emptyNotFound,
}: {
  rowsAt: string | null
  emptyNotFound?: string
}) {
  const NothingFound = z.looseObject({
    error: z.literal('not_found'),
    message: z.string().startsWith(emptyNotFound ?? ''),
  })
  const Found =
    rowsAt === null
      ? listOf(Row)
      : z
          .record(z.string(), z.unknown())
          .transform((body) => body[rowsAt])
          .pipe(listOf(Row))
  function build(body: unknown, parcial = false): Built {
    const found = Found.safeParse(body)
    if (!found.success) return { success: false, error: found.error }
    const paging = Paging.safeParse(body).data ?? null
    return Rows.safeParse({
      linhas: found.data,
      ...moreOf(body, found.data.length, paging),
      ...(paging === null ? {} : { total: paging.total }),
      ...(parcial ? { parcial } : {}),
    })
  }
  const output = z.unknown().transform((body, context): Rows => {
    const built = build(body)
    if (built.success) return built.data
    for (const issue of built.error.issues)
      context.issues.push({
        code: 'custom',
        message: issue.message,
        path: issue.path,
        input: body,
      })
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
      : {
          kind: 'UNREADABLE',
          native: { ...native, reason: shapeOf(built.error, answer.body) },
        }
  }
  return { output, answer }
}
