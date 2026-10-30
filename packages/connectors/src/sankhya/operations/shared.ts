import { z } from 'zod'
import type { OperationId } from '../../kernel/operation.ts'
import { Rows } from '../../kernel/rows.ts'

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
