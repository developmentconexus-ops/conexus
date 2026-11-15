import { z } from 'zod'

/*
 * The text of a search is ours, a constant in the code of each read; what the model gives goes in
 * only as an integer (Zod makes it digits) or as one quoted literal made here. The DbExplorer of
 * the kit's request takes no bound values, so this is the one hand-made piece of the searches:
 * `queryRequest` judges the whole statement again with `isOneReadStatement` before it leaves.
 */

const ACCENTED = 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ'
const PLAIN = 'AAAAAEEEEIIIIOOOOOUUUUC'
const MARKS = /--|\/\*|\*\/|;|\p{Cc}|\p{Zl}|\p{Zp}/u

/** The text the way the column is folded in the SQL: upper case, no accent (`TRANSLATE` takes the same two lists). */
function fold(text: string): string {
  return Array.from(text.normalize('NFC').toUpperCase(), (letter) => {
    const at = ACCENTED.indexOf(letter)
    return at === -1 ? letter : (PLAIN[at] ?? letter)
  }).join('')
}

/** A folded text as the inside of a `LIKE` literal: `\`, `%` and `_` stand for themselves, and a single quote is doubled. */
function escaped(text: string): string {
  return fold(text)
    .replace(/[\\%_]/g, '\\$&')
    .replaceAll("'", "''")
}

/** The column folded as `fold` folds a text, so a name matches with no regard to case or accent. */
function folded(column: string): string {
  return `TRANSLATE(UPPER(${column}), '${ACCENTED}', '${PLAIN}')`
}

/** The text a name search takes: 2 to 60 characters with no control character, line or paragraph separator, comment mark or `;`. */
export const SearchText = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .refine(
    (text) => !MARKS.test(text),
    'O texto tem um caractere que a busca não aceita: use letras, números e pontuação simples.',
  )

/** The column holds the text, in any case and with or without accent. */
export function containing(columns: readonly string[], text: string): string {
  const like = columns.map((column) => `${folded(column)} LIKE '%${escaped(text)}%' ESCAPE '\\'`)
  return like.length === 1 ? (like[0] ?? '') : `(${like.join(' OR ')})`
}

export function inList(column: string, codes: readonly number[]): string {
  return `${column} IN (${codes.join(', ')})`
}

export function between(column: string, from: number | undefined, to: number | undefined) {
  return [
    ...(from === undefined ? [] : [`${column} >= ${from}`]),
    ...(to === undefined ? [] : [`${column} <= ${to}`]),
  ]
}

/** A column of one letter, `S` or `N`, as Sankhya keeps its flags. */
export function flag(column: string, value: boolean): string {
  return `${column} = '${value ? 'S' : 'N'}'`
}

/** A text that is only digits (a document): the schema has already refused anything else. */
export function digits(column: string, value: string): string {
  return `${column} = '${z.string().regex(/^\d+$/).parse(value)}'`
}

type Page = {
  select: readonly string[]
  from: string
  where: readonly (string | undefined)[]
  order: string
  limit: number
}

/**
 * The one shape of every search: the filters joined with AND, ordered by code, and one row more than
 * `limit`, which carries `EXTRA` = `S` so the answer drops it and knows another page follows.
 */
export function pageSql({ select, from, where, order, limit }: Page): string {
  const conditions = where.filter((each) => each !== undefined)
  const filter = conditions.length === 0 ? '' : ` WHERE ${conditions.join(' AND ')}`
  const extra = `CASE WHEN ROW_NUMBER() OVER (ORDER BY ${order}) > ${limit} THEN 'S' ELSE 'N' END AS EXTRA`
  return `SELECT ${select.join(', ')}, ${extra} FROM ${from}${filter} ORDER BY ${order} OFFSET 0 ROWS FETCH NEXT ${limit + 1} ROWS ONLY`
}
