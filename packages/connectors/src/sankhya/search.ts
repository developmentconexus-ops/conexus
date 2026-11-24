import { z } from 'zod'
import { defineOperation } from '../kernel/operation.ts'
import { foundAnswer } from './answers.ts'
import { QueriedRows, queryRequest } from './door.ts'

/*
 * A search's SQL is a constant of its read; what the model gives enters only as a Zod integer or as
 * the one literal `contains` makes, since the DbExplorer request carries no bound values.
 * `queryRequest` judges the whole statement again before it leaves.
 */

/** The rows a search returns when the input gives no `limite`: the page the model reads, which the Hub's cut takes from here. */
export const SEARCH_PAGE_ROWS = 20

const ACCENTED = 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ'
const PLAIN = 'AAAAAEEEEIIIIOOOOOUUUUC'
const REFUSED_MARK = /--|\/\*|\*\/|;|\p{Cc}|\p{Zl}|\p{Zp}/u

/** The text a name search takes: 2 to 60 characters, with no control character, line or paragraph separator, comment mark or `;`. */
export const SearchText = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .refine(
    (text) => !REFUSED_MARK.test(text),
    'O texto tem um caractere que a busca não aceita: use letras, números e pontuação simples.',
  )

/** Upper case without accent, as `TRANSLATE(UPPER(column), ACCENTED, PLAIN)` folds the column. */
function folded(text: string): string {
  return Array.from(text.normalize('NFC').toUpperCase(), (letter) => {
    const at = ACCENTED.indexOf(letter)
    return at === -1 ? letter : (PLAIN[at] ?? letter)
  }).join('')
}

/**
 * Some column holds the text, in any case and with or without accent: a substring test by `REPLACE`,
 * not `LIKE`, so every character stands for itself on Oracle and on SQL Server. SQL Server's `LIKE`
 * reads `[` as a class (#929), and Oracle refuses an `ESCAPE` before it (ORA-01424). The
 * replacement keeps a mark, since Oracle reads an empty text as NULL; the quote is doubled.
 */
export function contains(columns: readonly string[], text: string): string {
  const literal = folded(text).replaceAll("'", "''")
  const each = columns.map((column) => {
    const value = `TRANSLATE(UPPER(${column}), '${ACCENTED}', '${PLAIN}')`
    return `REPLACE(${value}, '${literal}', '${literal}~') <> ${value}`
  })
  return each.length === 1 ? (each[0] ?? '') : `(${each.join(' OR ')})`
}

export function inList(column: string, codes: readonly number[]): string {
  return `${column} IN (${codes.join(', ')})`
}

/** A Sankhya flag column, `S` or `N`. */
export function flag(column: string, value: boolean): string {
  return `${column} = '${value ? 'S' : 'N'}'`
}

/** A code the model gives: a cursor, a bound, a company or a place. */
export const NonNegative = z.number().int().nonnegative()
export function Codes(most: number) {
  return z.array(NonNegative).min(1).max(most)
}
export const Limit = z.number().int().min(1).max(100)

/** A number column as the DbExplorer sends it: a number, or its digits as text. */
export const Num = z.union([
  z.number(),
  z
    .string()
    .regex(/^-?\d+(\.\d+)?$/)
    .transform(Number),
])
export const Whole = Num.pipe(z.number().int())
export const Text = z.string().nullable()
export const Flag = Text.transform((value) => value === 'S')

/** A condition of a search, or nothing when its input left it out. */
export type Filter = string | false | undefined

/** The part of a search its input decides: the filters, joined with AND, the order and the most rows. */
export type Page = { from: string; where: readonly Filter[]; order: string; limit: number }

/** The name the DbExplorer gives a selected column: its alias, or the column without its table. */
function nameOf(select: string): string {
  return /\w+$/.exec(select)?.[0] ?? select
}

/**
 * A read of Sankhya's tables through the DbExplorer. `row` is each answer row's shape and `columns` the
 * select of each of its fields. It asks one row past `limit`, marked `EXTRA = 'S'`, so the answer
 * drops it and knows another page follows; `temMais` is true too when Sankhya cut the list.
 */
export function defineSearch<
  I,
  Row extends z.ZodType<object, Record<string, NonNullable<unknown> | null>>,
>(search: {
  id: string
  subject: string
  summary: string
  label: string
  input: z.ZodType<I>
  row: Row
  columns: { readonly [K in keyof z.output<Row>]: string }
  probe: () => NoInfer<I> | null
  page: (input: NoInfer<I>) => Page
}) {
  const { row, columns, page, ...read } = search
  const fields = Object.entries<string>(columns).map(
    ([field, select]) => [field, nameOf(select)] as const,
  )
  const found = QueriedRows.transform(({ linhas, completo }) => {
    return {
      linhas: linhas
        .filter((each) => each.EXTRA !== 'S')
        .map((each) => Object.fromEntries(fields.map(([field, name]) => [field, each[name]]))),
      temMais: !completo || linhas.some((each) => each.EXTRA === 'S'),
    }
  }).pipe(z.object({ linhas: z.array(row), temMais: z.boolean() }))
  function sql(input: I): string {
    const { from, where, order, limit } = page(input)
    const filters = where.filter((each): each is string => Boolean(each))
    const extra = `CASE WHEN ROW_NUMBER() OVER (ORDER BY ${order}) > ${limit} THEN 'S' ELSE 'N' END AS EXTRA`
    return [
      `SELECT ${[...Object.values<string>(columns), extra].join(', ')} FROM ${from}`,
      ...(filters.length === 0 ? [] : [`WHERE ${filters.join(' AND ')}`]),
      `ORDER BY ${order} OFFSET 0 ROWS FETCH NEXT ${limit + 1} ROWS ONLY`,
    ].join(' ')
  }
  return defineOperation({
    ...read,
    class: 'read' as const,
    idempotent: true,
    output: z.looseObject({ responseBody: found }).transform((body) => body.responseBody),
    request: (input) => queryRequest(sql(input)),
    answer: (answer) => foundAnswer(answer, found),
  })
}
