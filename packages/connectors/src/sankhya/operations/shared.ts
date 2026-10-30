import { z } from 'zod'

/** A field the API may leave out or send as null: either way the kit hands on `null`. */
export function maybe<T extends z.ZodType>(schema: T) {
  return schema.nullish().transform((value) => value ?? null)
}

/** A page number: the API counts from 0 on some routes and from 1 on others. */
export function Page(from: 0 | 1) {
  return z.number().int().min(from)
}

// The documentation writes a date three ways; each filter takes the one its route names.
export const Date_ = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/)
export const DashDate = z.string().regex(/^\d{2}-\d{2}-\d{4}$/)
export const DateTime = z.string().regex(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)

export const Code = z.number().int()

/** The paging block most business routes send. */
export const Metadados = z.object({
  paginaAtual: Code,
  totalPaginas: Code,
  possuiMaisPaginas: z.boolean(),
})
