import { z } from 'zod'
import type { Answered, ProviderAnswer } from '../kernel/operation.ts'
import { gatewayAnswer } from './answers.ts'
import { QueriedColumn, QueriedRows } from './door.ts'
import { Code } from './operations/shared.ts'

/** How many rows a search returns when the input gives no `limite`: the cut the model reads (`hub/connectors/cut.ts`). */
export const DEFAULT_LIMIT = 20

/** A code the model gives: a cursor, a bound of a range, a company or a place. */
export const NonNegativeCode = Code.nonnegative()
export const Cursor = NonNegativeCode.optional()
export function Codes(most: number) {
  return z.array(NonNegativeCode).min(1).max(most)
}
export const Limit = z.number().int().min(1).max(100).optional()

/** A code, as the DbExplorer sends a number column: a number, or digits as text. */
export const Number_ = z.union([
  z.number(),
  z
    .string()
    .regex(/^-?\d+(\.\d+)?$/)
    .transform(Number),
])
export const Whole = Number_.pipe(Code)
export const Text = z.string().nullable()
export const Flag = z
  .string()
  .nullable()
  .transform((value) => value === 'S')
export const Extra = z.string().transform((value) => value === 'S')

/**
 * What a search reads of the DbExplorer's answer: every row by the schema of its columns, the row
 * past the limit (marked by `EXTRA`) dropped, and `temMais` true when there was one, or when Sankhya cut the list.
 */
export function foundIn<
  Row extends z.ZodType<{ extra: boolean }, Record<string, NonNullable<unknown> | null>>,
>(row: Row) {
  const Found = QueriedRows.pipe(
    z
      .object({ linhas: z.array(row), completo: z.boolean(), colunas: z.array(QueriedColumn) })
      .transform(({ linhas, completo }) => ({
        linhas: linhas.filter((each) => !each.extra).map(({ extra: _extra, ...kept }) => kept),
        temMais: !completo || linhas.some((each) => each.extra),
      })),
  )
  function answer(answered: ProviderAnswer): Answered<z.output<typeof Found>> {
    const result = gatewayAnswer(answered, Found)
    return result.kind === 'OK' && result.value.linhas.length === 0
      ? { ...result, empty: true }
      : result
  }
  // The raw body: the envelope, whose `responseBody` is what the DbExplorer answered.
  const output = z.looseObject({ responseBody: Found }).transform((body) => body.responseBody)
  return { output, answer }
}
