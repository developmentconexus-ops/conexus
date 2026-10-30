import { z } from 'zod'

/** A provider may send a list of one as the element itself: either way it reads as a list. */
export function listOf<T extends z.ZodType>(item: T) {
  return z.preprocess(
    (value) =>
      typeof value === 'object' && value !== null && !Array.isArray(value) ? [value] : value,
    z.array(item),
  )
}

/**
 * What every ready read gives: the rows as the provider sent them, and whether another page follows
 * (null: the route does not say). `parcial` is there only when the provider said the answer lacks
 * fields it could not fill (Mercado Livre's 206): the rows are what it sent, some fields are missing.
 */
export const Rows = z.object({
  linhas: z.array(z.record(z.string(), z.unknown())),
  temMais: z.boolean().nullable(),
  parcial: z.literal(true).optional(),
})
export type Rows = z.infer<typeof Rows>
