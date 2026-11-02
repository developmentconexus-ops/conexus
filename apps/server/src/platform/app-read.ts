import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { ProjectId } from '@conexus/hub-api'
import { appLogin, appLoginPassword } from '@conexus/hub-api'
import type { Context, SqlAnswer, SqlStatement } from './app-sql.ts'
import { LEDGER, missingLogins, quoted, REPLY_CAP_BYTES } from './app-sql.ts'
import { DatabaseUrl } from './database.ts'
import { COMPANY_DATABASE, NEON_CALL_BUDGET_MS } from './neon.ts'

/** What a read of the app's data gives: the rows, a refusal by the database, or a failure. */
export type AppRead =
  | { kind: 'ROWS'; columns: readonly string[]; rows: readonly unknown[][] }
  | { kind: 'REFUSED'; code: 'APP_DATA_REFUSED' }
  | {
      kind: 'FAILED'
      code: 'APP_DATA_UNAVAILABLE' | 'APP_DATA_TIMEOUT' | 'APP_DATA_NO_APP' | 'APP_DATA_TOO_LARGE'
    }
/** What the port answers: the login the read asked as is not there yet, which `ensureReadLogin` makes. */
export type AppReadAnswer = AppRead | { kind: 'NO_LOGIN' }

/** Where the dispatcher reaches the read login, as the edge does (`apps/edge/src/db.ts`), with no call to Neon. */
export async function readAddress(context: Context, host: string, projectId: ProjectId) {
  const { readLogin } = appLogin(projectId)
  const url = new URL(`postgresql://${host}/${COMPANY_DATABASE}?sslmode=require`)
  url.username = readLogin
  url.password = await appLoginPassword({ key: context.key, login: readLogin })
  return DatabaseUrl.parse(url.toString())
}

/**
 * The read login's own settings, set by the owner: the app's schema and call limits, and read-only
 * transactions as its default, which is depth: the barrier is that it holds only `SELECT`.
 */
export function readSettings(projectId: ProjectId): SqlStatement[] {
  const { schema, readLogin } = appLogin(projectId)
  const [s, read] = [schema, readLogin].map(quoted)
  return [
    { text: `ALTER ROLE ${read} SET search_path = ${s}` },
    { text: `ALTER ROLE ${read} SET default_transaction_read_only = on` },
    { text: `ALTER ROLE ${read} SET statement_timeout = ${APP_CALL_LIMITS.statementTimeoutMs}` },
    {
      text: `ALTER ROLE ${read} SET transaction_timeout = ${APP_CALL_LIMITS.transactionTimeoutMs}`,
    },
  ]
}

/**
 * What the read login holds, granted by the migration login, the schema's owner: `USAGE` and
 * `SELECT` on every table, today's and later ones, and never the ledger of the migrations.
 */
export function readGrants(projectId: ProjectId): SqlStatement[] {
  const { schema, readLogin } = appLogin(projectId)
  const [s, read] = [schema, readLogin].map(quoted)
  return [
    { text: `GRANT USAGE ON SCHEMA ${s} TO ${read}` },
    { text: `ALTER DEFAULT PRIVILEGES IN SCHEMA ${s} GRANT SELECT ON TABLES TO ${read}` },
    { text: `GRANT SELECT ON ALL TABLES IN SCHEMA ${s} TO ${read}` },
    { text: `REVOKE ALL ON ${s}.${LEDGER} FROM ${read}` },
  ]
}

/** SQLSTATE of a role that exists already: a second turn made it between the look and the act. */
const DUPLICATE_OBJECT = '42710'

/**
 * The read login of an app that has none, with its settings and grants, in one transaction; one
 * found is set again the same. A turn that lost the race to make it reads again and finds it.
 */
export async function ensureReadLogin(
  context: Context,
  owner: DatabaseUrl,
  projectId: ProjectId,
): Promise<SqlAnswer> {
  const signal = AbortSignal.timeout(NEON_CALL_BUDGET_MS)
  const { migrateLogin, readLogin } = appLogin(projectId)
  async function once() {
    const created = await missingLogins(context, owner, [readLogin], signal)
    if (!Array.isArray(created)) return created
    return context.transport(
      owner,
      [
        ...created,
        { text: `GRANT ${quoted(migrateLogin)} TO CURRENT_USER WITH INHERIT FALSE, SET TRUE` },
        ...readSettings(projectId),
        { text: `SET LOCAL ROLE ${quoted(migrateLogin)}` },
        ...readGrants(projectId),
      ],
      signal,
    )
  }
  const first = await once()
  return first.kind === 'REFUSED' && first.code === DUPLICATE_OBJECT ? once() : first
}

/** SQLSTATEs of a login that is not there, or whose password is not the derived one. */
const NO_LOGIN = new Set(['28000', '28P01'])

/** Classes of the call's own timeouts: `statement_timeout` and `transaction_timeout`. */
const TIMED_OUT = new Set(['57014', '25P04'])

/**
 * One statement as the read login, in a read-only transaction. What PostgreSQL refuses is
 * refused, whatever the refusal (a write, a command past the first, a table the login cannot
 * read): there is no filter of ours before it. The answer never carries the text or a value.
 */
export async function readApp(
  context: Context,
  read: DatabaseUrl,
  sql: string,
  signal: AbortSignal,
): Promise<AppReadAnswer> {
  const answer = await context.transport(read, [{ text: sql }], signal, { readOnly: true })
  switch (answer.kind) {
    case 'DONE': {
      const listed = answer.value[0] ?? []
      if (Buffer.byteLength(JSON.stringify(listed)) > REPLY_CAP_BYTES) {
        return { kind: 'FAILED', code: 'APP_DATA_TOO_LARGE' }
      }
      const columns = Object.keys(listed[0] ?? {})
      return { kind: 'ROWS', columns, rows: listed.map((row) => Object.values(row)) }
    }
    case 'TOO_LARGE':
      return { kind: 'FAILED', code: 'APP_DATA_TOO_LARGE' }
    case 'NO_ANSWER':
      return { kind: 'FAILED', code: signal.aborted ? 'APP_DATA_TIMEOUT' : 'APP_DATA_UNAVAILABLE' }
    case 'REFUSED':
      if (NO_LOGIN.has(answer.code)) return { kind: 'NO_LOGIN' }
      if (TIMED_OUT.has(answer.code)) return { kind: 'FAILED', code: 'APP_DATA_TIMEOUT' }
      return { kind: 'REFUSED', code: 'APP_DATA_REFUSED' }
    default:
      return answer satisfies never
  }
}
