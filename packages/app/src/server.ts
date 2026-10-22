import type { Context, Db, Handler, Row, Statement } from '@conexus/app-contract'
import { z } from 'zod'
import type { Operations } from './operations.ts'

/**
 * What a refused statement answers: PostgreSQL's five characters, or the platform's word for a
 * statement that never reached it. Never the statement, a value or the login (decision 0045).
 */
export const Sqlstate = z.string().min(1).max(32).brand<'Sqlstate'>()
export type Sqlstate = z.infer<typeof Sqlstate>

/** The database refused a call. It carries the code alone, so a log of it holds no app data. */
export class DatabaseRefused extends Error {
  readonly code: Sqlstate

  constructor(code: Sqlstate) {
    super(code)
    this.name = 'DatabaseRefused'
    this.code = code
  }
}

function refusedBy(answer: Readonly<{ error: { code: string } }>): DatabaseRefused {
  return new DatabaseRefused(Sqlstate.parse(answer.error.code))
}

/** Reads rows, each checked against `row` once, at the boundary (code C27). */
export async function query<R>(
  db: Db,
  row: z.ZodType<R>,
  text: string,
  values?: readonly unknown[],
): Promise<R[]> {
  const answer = await db.query(text, values)
  if ('error' in answer) throw refusedBy(answer)
  return answer.rows.map((each) => row.parse(each))
}

/** Writes every statement in one transaction: all of them or none (decision 0045). */
export async function write(db: Db, statements: readonly Statement[]): Promise<(readonly Row[])[]> {
  const answer = await db.batch(statements)
  if ('error' in answer) throw refusedBy(answer)
  return answer.results.map(({ rows }) => rows)
}

type Handlers<O extends Operations> = {
  readonly [K in keyof O & string]: (
    input: z.output<O[K]['input']>,
    context: Context,
  ) => z.input<O[K]['output']> | Promise<z.input<O[K]['output']>>
}

/**
 * The handlers of the declared operations, typed by them. The manifest holds only shapes whose input
 * and output are the same in Zod and in JSON (`manifestOf` refuses the rest), and the runtime checks
 * both against it, so a handler's types are exactly what it is called with and may answer.
 */
export function defineHandlers<const O extends Operations>(
  operations: O,
  handlers: Handlers<O>,
): Record<string, Handler>
export function defineHandlers(
  _operations: Operations,
  handlers: Record<string, Handler>,
): Record<string, Handler> {
  return handlers
}
