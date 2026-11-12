import { z } from 'zod'
import type {
  Account,
  ListRead,
  Operation,
  OperationId,
  ProviderRequest,
} from '../../kernel/operation.ts'
import { defineOperation, valueAt } from '../../kernel/operation.ts'
import type { Rows } from '../../kernel/rows.ts'
import { Rows as RowsOut } from '../../kernel/rows.ts'
import { rows } from '../answers.ts'

/** An id in a request path or query: one safe segment. */
export const PathId = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/)

export const Offset = z.number().int().min(0)
export function Limit(max: number) {
  return z.number().int().min(1).max(max)
}

/** The entries of a scan read (itens and questions search): `scan` starts one, `scrollId` carries it on. */
export const Scan = {
  scan: z.literal(true).optional(),
  scrollId: z.string().min(1).max(4000).optional(),
}

/** A scan's `scroll_id` lives 5 minutes (itens-e-buscas): the copy never sends an older one. */
export const SCROLL_TTL_MS = 300_000

/** The `search_type` the route wants while a scan runs: from its first page on. */
export function searchTypeOf(input: Readonly<{ scan?: true; scrollId?: string }>) {
  return input.scan === true || input.scrollId !== undefined ? 'scan' : undefined
}

/** A scan pages by its cursor, not by `offset`: the two together are refused where the input is read, so no request carries both. */
export const scanAlone = {
  check: (input: Readonly<{ scan?: true; scrollId?: string; offset?: number }>) =>
    searchTypeOf(input) === undefined || input.offset === undefined,
  issue: {
    message: 'A scan pages by scrollId; send no offset with scan or scrollId',
    path: ['offset'],
  },
}

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
  paged?: ListRead // how the list pages and asks only what changed: the copy engine reads it as the operation's `list`
  omit?: readonly string[] // the buyer's personal data, by dotted path
  emptyNotFound?: string // the start of the message of the 404 that means the seller has no data yet
  from?: readonly string[]
  probe(earlier: ReadonlyMap<OperationId, unknown>): NoInfer<I> | null
  request(input: I, account: Account): ProviderRequest
}>

/** A read of Mercado Livre: idempotent by class, answered as rows by the API's own table (`rows`). */
export function readOf<I>(spec: ReadSpec<I>): Operation<I, Rows, 'read'> {
  const { docs, list, omit, emptyNotFound, paged, ...operation } = spec
  const defined = defineOperation({
    ...operation,
    ...(paged === undefined ? {} : { list: paged }),
    class: 'read' as const,
    idempotent: true,
    ...rows({ list, omit, emptyNotFound }),
  })
  DOCS.set(defined.id, docs)
  return defined
}

const Identity = z.union([
  z.string().regex(/^[A-Za-z0-9_-]{1,40}$/),
  z.number().int().nonnegative().transform(String),
])

/** The rows an earlier read gave. */
function rowsOf(earlier: ReadonlyMap<OperationId, unknown>, id: OperationId) {
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

/** A probe that reads one identity of an earlier read and asks with it (`ask`); none to read, none to probe. */
export function chain<I>(from: OperationId, path: string, ask: (id: string) => I) {
  return (earlier: ReadonlyMap<OperationId, unknown>): I | null => {
    const found = firstId(earlier, from, path)
    return found === undefined ? null : ask(found)
  }
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
