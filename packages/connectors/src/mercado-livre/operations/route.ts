import { z } from 'zod'
import type {
  Account,
  ListRead,
  Operation,
  OperationId,
  ProviderRequest,
} from '../../kernel/operation.ts'
import { defineOperation, valueAt } from '../../kernel/operation.ts'
import { Rows } from '../../kernel/rows.ts'
import { rowsAnswer } from '../answers.ts'

export const PathId = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/)

export const Offset = z.number().int().min(0)
export function Limit(max: number) {
  return z.number().int().min(1).max(max)
}

export const Scan = {
  scan: z.literal(true).optional(),
  scrollId: z.string().min(1).max(4000).optional(),
}

/** A scan's `scroll_id` lives 5 minutes (itens-e-buscas): the copy never sends an older one. */
export const SCROLL_TTL_MS = 300_000

export function searchTypeOf(input: Readonly<{ scan?: true; scrollId?: string }>) {
  return input.scan === true || input.scrollId !== undefined ? 'scan' : undefined
}

export const scanAlone = {
  check: (input: Readonly<{ scan?: true; scrollId?: string; offset?: number }>) =>
    searchTypeOf(input) === undefined || input.offset === undefined,
  issue: {
    message: 'A scan pages by scrollId; send no offset with scan or scrollId',
    path: ['offset'],
  },
}

export function sellerOf(account: Account): string {
  if (account.ref === null) throw new Error('Mercado Livre read without an account')
  return account.ref
}

const DOCS = new Map<OperationId, string>()
export function docsOf(operation: Pick<Operation<never, unknown>, 'id'>): string | undefined {
  return DOCS.get(operation.id)
}

export function defineRoute<I>(route: {
  id: string
  subject: string
  docs: string
  summary: string
  label: string
  input: z.ZodType<I>
  rowsAt: string | null
  list?: ListRead
  emptyNotFound?: string
  from?: readonly string[]
  probe: (earlier: ReadonlyMap<OperationId, unknown>) => NoInfer<I> | null
  request: (input: I, account: Account) => ProviderRequest
}): Operation<I, Rows, 'read'> {
  const { docs, rowsAt, emptyNotFound, ...read } = route
  const defined = defineOperation({
    ...read,
    class: 'read' as const,
    idempotent: true,
    ...rowsAnswer({ rowsAt, emptyNotFound }),
  })
  DOCS.set(defined.id, docs)
  return defined
}

const Identity = z.union([PathId, z.number().int().nonnegative().transform(String)])

function rowsOf(earlier: ReadonlyMap<OperationId, unknown>, read: OperationId) {
  return Rows.safeParse(earlier.get(read)).data?.linhas ?? []
}

export function firstId(
  earlier: ReadonlyMap<OperationId, unknown>,
  read: OperationId,
  path: string,
): string | undefined {
  return rowsOf(earlier, read)
    .map((row) => Identity.safeParse(valueAt(row, path)).data)
    .find((found) => found !== undefined)
}

export function chain<I>(from: OperationId, path: string, ask: (id: string) => I) {
  return (earlier: ReadonlyMap<OperationId, unknown>): I | null => {
    const found = firstId(earlier, from, path)
    return found === undefined ? null : ask(found)
  }
}

export function ids(
  earlier: ReadonlyMap<OperationId, unknown>,
  read: OperationId,
  path: string,
  count: number,
): string[] {
  return rowsOf(earlier, read)
    .flatMap((row) => Identity.safeParse(valueAt(row, path)).data ?? [])
    .slice(0, count)
}

export function firstRowWith(
  earlier: ReadonlyMap<OperationId, unknown>,
  read: OperationId,
  paths: readonly string[],
): Record<string, unknown> | undefined {
  return rowsOf(earlier, read).find((row) => paths.every((path) => valueAt(row, path) != null))
}

export const Decimal = z.union([
  z.number(),
  z
    .string()
    .regex(/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/)
    .transform(Number),
])
