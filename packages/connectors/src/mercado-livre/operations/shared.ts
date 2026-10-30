import { z } from 'zod'
import type { Account, Operation, OperationId, ProviderRequest } from '../../kernel/operation.ts'
import { defineOperation } from '../../kernel/operation.ts'
import type { Rows } from '../../kernel/rows.ts'
import { Rows as RowsOut } from '../../kernel/rows.ts'
import { rows } from '../answers.ts'

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

type ReadSpec<I> = Readonly<{
  id: string
  subject: string
  docs: string
  summary: string
  label: string
  input: z.ZodType<I>
  list: string | null // where the rows are: a key of the body, or the body itself
  omit?: readonly string[] // the buyer's personal data, by dotted path
  from?: readonly string[]
  probe(earlier: ReadonlyMap<OperationId, unknown>): NoInfer<I> | null
  request(input: I, account: Account): ProviderRequest
}>

/** A read of Mercado Livre: idempotent by class, answered as rows by the API's own table (`rows`). */
export function readOf<I>(spec: ReadSpec<I>): Operation<I, Rows, 'read'> {
  const { docs, list, omit, ...operation } = spec
  const defined = defineOperation({
    ...operation,
    class: 'read' as const,
    idempotent: true,
    ...rows({ list, omit }),
  })
  DOCS.set(defined.id, docs)
  return defined
}

const Identity = z.union([
  z.string().regex(/^[A-Za-z0-9_-]{1,40}$/),
  z.number().int().nonnegative().transform(String),
])

export function valueAt(row: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (at, key) => (typeof at === 'object' && at !== null ? Reflect.get(at, key) : undefined),
      row,
    )
}

/** The rows an earlier read gave. */
export function rowsOf(earlier: ReadonlyMap<OperationId, unknown>, id: OperationId) {
  return RowsOut.safeParse(earlier.get(id)).data?.linhas ?? []
}

/** The first identity `path` an earlier read gave (text or number, one safe path segment): what a probe chains on. */
export function firstId(
  earlier: ReadonlyMap<OperationId, unknown>,
  id: OperationId,
  path: string,
): string | undefined {
  return rowsOf(earlier, id)
    .map((row) => Identity.safeParse(valueAt(row, path)).data)
    .find((found) => found !== undefined)
}

/** Up to `count` identities `path` of an earlier read, from the rows that have one. */
export function ids(
  earlier: ReadonlyMap<OperationId, unknown>,
  id: OperationId,
  path: string,
  count: number,
): string[] {
  return rowsOf(earlier, id)
    .flatMap((row) => Identity.safeParse(valueAt(row, path)).data ?? [])
    .slice(0, count)
}

/** The first row of an earlier read that has every `path`, with each as the type the route sends (a number stays a number, an id is text). */
export function firstRowWith(
  earlier: ReadonlyMap<OperationId, unknown>,
  id: OperationId,
  paths: readonly string[],
): Record<string, unknown> | undefined {
  return rowsOf(earlier, id).find((row) => paths.every((path) => valueAt(row, path) != null))
}
