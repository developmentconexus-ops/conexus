import { z } from 'zod'
import type { Answered, Failure, Native, ProviderAnswer } from '../../kernel/operation.ts'
import { defineOperation, failedBy, get, shapeOf } from '../../kernel/operation.ts'
import type { PersonalField } from '../../kernel/personal.ts'
import type { Rows } from '../../kernel/rows.ts'

/** An error body of HubSpot: `{ status: "error", message, category, correlationId }`. */
const Refusal = z.looseObject({ message: z.string().optional(), category: z.string().optional() })

function nativeOf(answer: ProviderAnswer): Native {
  if (answer.status >= 200 && answer.status < 300)
    return { status: answer.status, code: null, message: null, body: null }
  const found = Refusal.safeParse(answer.body)
  return {
    status: answer.status,
    code: found.success ? (found.data.category ?? null) : null,
    message: found.success ? (found.data.message ?? null) : null,
    body: answer.body,
  }
}

/** A status outside 2xx: a 401 is a token ended early, the Hub renews once and repeats; the rest is the kernel's table. */
export function failureOf(answer: ProviderAnswer): Failure | null {
  if (answer.status >= 200 && answer.status < 300) return null
  const native = nativeOf(answer)
  return answer.status === 401 ? { kind: 'TOKEN_EXPIRED', native } : failedBy(answer, native)
}

/** What a page of CRM objects keeps: the rows under `results` and, while more follow, the cursor under `paging.next.after`. */
const Page = z.looseObject({
  results: z.array(z.record(z.string(), z.unknown())),
  paging: z
    .looseObject({ next: z.looseObject({ after: z.string().min(1).max(4000) }).optional() })
    .optional(),
})

const output = Page.transform(
  (page): Rows => ({
    linhas: page.results,
    temMais: page.paging?.next !== undefined,
    ...(page.paging?.next === undefined ? {} : { seguinte: page.paging.next.after }),
  }),
)

function answer(answer: ProviderAnswer): Answered<Rows> {
  const failure = failureOf(answer)
  if (failure) return failure
  const parsed = output.safeParse(answer.body)
  if (!parsed.success)
    return {
      kind: 'UNREADABLE',
      native: { ...nativeOf(answer), reason: shapeOf(parsed.error, answer.body) },
    }
  return parsed.data.linhas.length === 0
    ? { kind: 'OK', value: parsed.data, empty: true }
    : { kind: 'OK', value: parsed.data }
}

/** One page of a CRM object: up to 100 records, the next page's cursor in `after`. */
const PAGE_ROWS = 100

const Input = z.object({
  after: z.string().min(1).max(4000).optional(),
  limit: z.number().int().min(1).max(PAGE_ROWS).optional(),
})

/**
 * A page of cursors HubSpot documents no age for: the copy never treats one as stale. "A confirmar na
 * gravação" (9.1).
 */
const CURSOR_NEVER_EXPIRES = Number.MAX_SAFE_INTEGER

/** A list read of `GET /crm/v3/objects/<object>`: the properties the page names are the ones it asks for. */
export function listRead(spec: {
  id: string
  object: 'contacts' | 'companies' | 'deals'
  subject: string
  summary: string
  label: string
  properties: readonly string[]
  personal?: readonly PersonalField[]
}) {
  return defineOperation({
    id: spec.id,
    class: 'read' as const,
    subject: spec.subject,
    idempotent: true,
    summary: spec.summary,
    label: spec.label,
    input: Input,
    ...(spec.personal === undefined ? {} : { personal: spec.personal }),
    list: {
      paging: {
        kind: 'CURSOR',
        cursor: 'after',
        limit: 'limit',
        max: PAGE_ROWS,
        start: {},
        ttlMs: CURSOR_NEVER_EXPIRES,
      },
      changed: null,
    },
    output,
    answer,
    probe: () => ({ limit: 5 }),
    request: (input) =>
      get(`/crm/v3/objects/${spec.object}`, {
        properties: spec.properties.join(','),
        limit: input.limit,
        after: input.after,
      }),
  })
}
