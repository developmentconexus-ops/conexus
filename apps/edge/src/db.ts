import type { Db as AppDb, Row } from '@conexus/app-contract'
import { appLoginPassword } from '@conexus/hub-api'
import { NeonDbError, neon } from '@neondatabase/serverless'

/**
 * What the dispatcher binds one call's `db` to; the app reads none of it (decision 0043). The
 * login's own `search_path` names its schema, set when the login is made; `endsAt` is the instant,
 * in epoch milliseconds, the app's call reaches its deadline (decision 0047).
 */
export type DbProps = Readonly<{ login: string; host: string; database: string; endsAt: number }>

/** SQLSTATE class 08, connection exception: the answer when Neon gave none. */
const NO_CONNECTION = '08000'
/** The answer to a `db` call made, or still waiting, after its app call's deadline. */
const DEADLINE = { error: { code: 'DB_DEADLINE' } } as const

/** The dispatcher's log line of a call refused at its deadline, in the shape of its pages' lines. */
function pastDeadline() {
  console.error(JSON.stringify({ level: 40, msg: 'DB_DEADLINE' }))
  return DEADLINE
}

/** A refusal tells the app only PostgreSQL's code: never the statement, a value or the login. */
function failureOf(error: unknown, signal: AbortSignal): Readonly<{ error: { code: string } }> {
  if (signal.aborted) return pastDeadline()
  const code = error instanceof NeonDbError ? error.code : undefined
  return { error: { code: code ?? NO_CONNECTION } }
}

/**
 * The app's `db` of one login (decision 0045): each call opens its own HTTP transaction, and the
 * password is derived from the key for it and goes only into Neon's request (decision 0043). A call
 * after the app call's deadline never reaches Neon, and one under way is cut at it (decision 0047).
 */
export function dbOf(key: string, { login, host, database, endsAt }: DbProps): AppDb {
  async function sqlOf(signal: AbortSignal) {
    const url = new URL(`postgresql://${host}/${database}?sslmode=require`)
    url.username = login
    url.password = await appLoginPassword({ key, login })
    return neon(url.toString(), { fetchOptions: { signal } })
  }
  /** The time the app call has left, as the driver's signal; none once its deadline passed. */
  function timeLeft(): AbortSignal | undefined {
    const left = endsAt - Date.now()
    return left > 0 ? AbortSignal.timeout(left) : undefined
  }
  return {
    /** One statement in a read-only transaction: PostgreSQL refuses a write (decision 0045). */
    async query(text, values = []) {
      const signal = timeLeft()
      if (signal === undefined) return pastDeadline()
      try {
        const sql = await sqlOf(signal)
        const [rows = []]: Row[][] = await sql.transaction([sql.query(text, [...values])], {
          readOnly: true,
        })
        return { rows }
      } catch (error) {
        return failureOf(error, signal)
      }
    },
    /** Every statement in one transaction, all or none. */
    async batch(statements) {
      const signal = timeLeft()
      if (signal === undefined) return pastDeadline()
      try {
        const sql = await sqlOf(signal)
        const results: Row[][] = await sql.transaction(
          statements.map(({ text, values }) => sql.query(text, [...(values ?? [])])),
        )
        return { results: results.map((rows) => ({ rows })) }
      } catch (error) {
        return failureOf(error, signal)
      }
    },
  }
}
