import { z } from 'zod'
import type { OperationId, ProviderRequest } from '../../kernel/operation.ts'

/** Sankhya sends a list of one as the element itself: either way it reads as a list. */
export function listOf<T extends z.ZodType>(item: T) {
  return z.preprocess(
    (value) =>
      typeof value === 'object' && value !== null && !Array.isArray(value) ? [value] : value,
    z.array(item),
  )
}

/** What every ready read gives: the rows as Sankhya sent them, and whether another page follows (null: the route does not say). */
export const Rows = z.object({
  linhas: z.array(z.record(z.string(), z.unknown())),
  temMais: z.boolean().nullable(),
})
export type Rows = z.infer<typeof Rows>

/** A page number: the API counts from 0 on some routes and from 1 on others. */
export function Page(from: 0 | 1) {
  return z.number().int().min(from)
}

// The documentation writes a date three ways; each filter takes the one its route names.
export const Date_ = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/)
export const DashDate = z.string().regex(/^\d{2}-\d{2}-\d{4}$/)
export const DateTime = z.string().regex(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)

export const Code = z.number().int()

/** A code as a row carries it: the invoices send it as text, the orders as a number. */
const Identity = z.union([Code, z.string().regex(/^\d+$/).transform(Number)])

/** The first code `field` an earlier read gave, from the first row that has one: what a probe chains on. */
export function firstCode(
  earlier: ReadonlyMap<OperationId, unknown>,
  id: OperationId,
  field: string,
): number | undefined {
  const linhas = Rows.safeParse(earlier.get(id)).data?.linhas ?? []
  return linhas.map((row) => Identity.safeParse(row[field]).data).find((code) => code !== undefined)
}

/** The REST read: the path with its query, a key left undefined is not sent. */
export function get(
  path: `/${string}`,
  query: Readonly<Record<string, string | number | boolean | undefined>>,
): ProviderRequest {
  const set = Object.entries(query).flatMap(([name, value]) =>
    value === undefined ? [] : [[name, String(value)] as const],
  )
  return { method: 'GET', path, query: Object.fromEntries(set), body: undefined }
}
