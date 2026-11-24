import { z } from 'zod'
import type { OperationId, ProviderRequest } from '../../kernel/operation.ts'
import { defineOperation } from '../../kernel/operation.ts'
import { Rows } from '../../kernel/rows.ts'
import { restRows } from '../answers.ts'

export const Code = z.number().int()

/** A page number: some routes count from 0, others from 1. */
export function Page(first: 0 | 1) {
  return z.number().int().min(first)
}

/** The input of a list that takes nothing but its page, the first being 0. */
export const FirstPage = z.strictObject({ page: Page(0) })

// The documentation writes a date three ways; each filter takes its route's.
export const Day = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/)
export const DashDay = z.string().regex(/^\d{2}-\d{2}-\d{4}$/)
export const DayAndTime = z.string().regex(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)

/** A code as a row carries it: the invoices send it as text, the orders as a number. */
const RowCode = z.union([Code, z.string().regex(/^\d+$/).transform(Number)])

/** The first `field` code an earlier read gave, from the first row that has one: what a probe chains on. */
export function firstCode(
  earlier: ReadonlyMap<OperationId, unknown>,
  read: OperationId,
  field: string,
): number | undefined {
  const linhas = Rows.safeParse(earlier.get(read)).data?.linhas ?? []
  return linhas.map((row) => RowCode.safeParse(row[field]).data).find((code) => code !== undefined)
}

/** A read of one of Sankhya's published REST routes, its rows under `rowsAt`. */
export function defineRoute<I>(route: {
  id: string
  subject: string
  summary: string
  label: string
  input: z.ZodType<I>
  rowsAt: string
  from?: readonly OperationId[]
  probe: (earlier: ReadonlyMap<OperationId, unknown>) => NoInfer<I> | null
  request: (input: NoInfer<I>) => ProviderRequest
}) {
  const { rowsAt, ...read } = route
  return defineOperation({ ...read, class: 'read' as const, idempotent: true, ...restRows(rowsAt) })
}
