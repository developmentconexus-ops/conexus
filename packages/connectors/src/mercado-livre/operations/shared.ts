import { z } from 'zod'
import type { Account, Operation, OperationId, ProviderRequest } from '../../kernel/operation.ts'
import { defineOperation } from '../../kernel/operation.ts'
import { mlAnswer } from '../answers.ts'

/** A field the API may leave out or send as null: either way the kit hands on `null`. */
export function maybe<T extends z.ZodType>(schema: T) {
  return schema.nullish().transform((value) => value ?? null)
}

/** An id the API sends as a number or as text; the kit hands on text. */
export const Id = z.union([z.string().min(1), z.number().int()]).transform(String)

/** An id in a request path or query: one safe segment. */
export const PathId = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/)

export const Offset = z.number().int().min(0)
export function Limit(max: number) {
  return z.number().int().min(1).max(max)
}

/** The date-time the API takes in filters: ISO 8601 with its offset. */
export const Instant = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/)

export const Paging = z.object({
  total: z.number().int(),
  offset: maybe(z.number().int()),
  limit: maybe(z.number().int()),
})

/** The seller's id in a path: the connection's account, which the Hub parses again when it opens the connection. */
export function sellerOf(account: Account): string {
  if (account.ref === null) throw new Error('Mercado Livre read without an account')
  return account.ref
}

/** What each read cites: the documentation page that holds its route, checked by `docs.test.ts`. */
const DOCS = new Map<OperationId, string>()
export function docsOf(operation: Pick<Operation<never, unknown>, 'id'>): string | undefined {
  return DOCS.get(operation.id)
}

type ReadSpec<I, O> = Readonly<{
  id: string
  subject: string
  docs: string
  summary: string
  label: string
  input: z.ZodType<I>
  output: z.ZodType<O>
  from?: readonly string[]
  probe(earlier: ReadonlyMap<OperationId, unknown>): NoInfer<I> | null
  request(input: I, account: Account): ProviderRequest
}>

/** A read of Mercado Livre: idempotent by class, answered by the API's own table (`mlAnswer`). */
export function readOf<I, O>(spec: ReadSpec<I, O>): Operation<I, O, 'read'> {
  const { docs, ...operation } = spec
  const defined = defineOperation({
    ...operation,
    class: 'read' as const,
    idempotent: true,
    answer: (answer) => mlAnswer(answer, spec.output),
  })
  DOCS.set(defined.id, docs)
  return defined
}

/** What an earlier read gave, parsed again by its own output schema; null when it gave nothing the probe can use. */
export function fromEarlier<O, R>(
  earlier: ReadonlyMap<OperationId, unknown>,
  source: Readonly<{ id: OperationId; output: z.ZodType<O> }>,
  use: (value: O) => R | null | undefined,
): R | null {
  const value = source.output.safeParse(earlier.get(source.id))
  return value.success ? (use(value.data) ?? null) : null
}
