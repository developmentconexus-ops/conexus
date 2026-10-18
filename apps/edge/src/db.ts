import type { Db as AppDb, Row } from '@conexus/app-contract'
import { appLoginPassword } from '@conexus/hub-api'
import { NeonDbError, neon } from '@neondatabase/serverless'

/**
 * What the dispatcher binds one call's `db` to; the app reads none of it (decision 0043). The
 * login's own `search_path` names its schema, set when the login is made.
 */
export type DbProps = Readonly<{ login: string; host: string; database: string }>

// The login's statement_timeout is 5 s; Neon's HTTP proxy wakes a sleeping compute in up to 1.6 s
// (0009). The request's deadline covers both, with the reply.
const QUERY_DEADLINE_MS = 10_000
/** SQLSTATE class 08, connection exception: the answer when Neon gave none. */
const NO_CONNECTION = '08000'

/** A refusal tells the app only PostgreSQL's code: never the statement, a value or the login. */
function failureOf(error: unknown): Readonly<{ error: { code: string } }> {
  const code = error instanceof NeonDbError ? error.code : undefined
  return { error: { code: code ?? NO_CONNECTION } }
}

/**
 * The app's `db` of one login (decision 0045): each call opens its own HTTP transaction, and the password is derived from
 * the key for it and goes only into Neon's request (decision 0043).
 */
export function dbOf(key: string, { login, host, database }: DbProps): AppDb {
  async function sqlOf() {
    const url = new URL(`postgresql://${host}/${database}?sslmode=require`)
    url.username = login
    url.password = await appLoginPassword({ key, login })
    return neon(url.toString(), {
      fetchOptions: { signal: AbortSignal.timeout(QUERY_DEADLINE_MS) },
    })
  }
  return {
    /** One statement in a read-only transaction: PostgreSQL refuses a write (decision 0045). */
    async query(text, values = []) {
      try {
        const sql = await sqlOf()
        const [rows = []]: Row[][] = await sql.transaction([sql.query(text, [...values])], {
          readOnly: true,
        })
        return { rows }
      } catch (error) {
        return failureOf(error)
      }
    },
    /** Every statement in one transaction, all or none. */
    async batch(statements) {
      try {
        const sql = await sqlOf()
        const results: Row[][] = await sql.transaction(
          statements.map(({ text, values }) => sql.query(text, [...(values ?? [])])),
        )
        return { results: results.map((rows) => ({ rows })) }
      } catch (error) {
        return failureOf(error)
      }
    },
  }
}
