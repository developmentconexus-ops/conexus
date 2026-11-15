import { APP_CALL_LIMITS } from '@conexus/app-contract'
import { appLoginPassword } from '@conexus/hub-api'
import type { Context, ReadResult, SqlAnswer, SqlStatement } from './app-sql.ts'
import { missingLogins, quoted, REPLY_CAP_BYTES } from './app-sql.ts'
import {
  budget,
  DUPLICATE_OBJECT,
  READ_LOGIN,
  ROLES_LOCK,
  SYNC_LOGIN,
  SYNC_SCHEMA,
} from './copy-sql.ts'
import { DatabaseUrl } from './database.ts'
import { COMPANY_DATABASE } from './neon.ts'

/**
 * The login that reads the `sync` schema and nothing else, as the company's owner, after
 * `ensureSync`: read-only transactions as its default (depth) and `SELECT` alone as the barrier,
 * on today's tables and later ones. Repeatable, as `ensureReadLogin` of an app.
 */
async function ensureReader(context: Context, owner: DatabaseUrl): Promise<SqlAnswer> {
  const signal = budget()
  async function once() {
    const created = await missingLogins(context, owner, [READ_LOGIN], signal)
    if (!Array.isArray(created)) return created
    const [read, sync] = [READ_LOGIN, SYNC_LOGIN].map(quoted)
    return context.transport(
      owner,
      [
        ROLES_LOCK,
        ...created,
        { text: `ALTER ROLE ${read} SET search_path = ${SYNC_SCHEMA}` },
        { text: `ALTER ROLE ${read} SET default_transaction_read_only = on` },
        {
          text: `ALTER ROLE ${read} SET statement_timeout = ${APP_CALL_LIMITS.statementTimeoutMs}`,
        },
        {
          text: `ALTER ROLE ${read} SET transaction_timeout = ${APP_CALL_LIMITS.transactionTimeoutMs}`,
        },
        { text: `SET LOCAL ROLE ${sync}` },
        { text: `GRANT USAGE ON SCHEMA ${SYNC_SCHEMA} TO ${read}` },
        { text: `GRANT SELECT ON ALL TABLES IN SCHEMA ${SYNC_SCHEMA} TO ${read}` },
        {
          text: `ALTER DEFAULT PRIVILEGES IN SCHEMA ${SYNC_SCHEMA} GRANT SELECT ON TABLES TO ${read}`,
        },
      ],
      signal,
    )
  }
  const first = await once()
  return first.kind === 'REFUSED' && first.code === DUPLICATE_OBJECT ? once() : first
}

/** Where the Hub reaches the read login, from the host it recorded, with no call to Neon. */
async function readerAddress(context: Context, host: string): Promise<DatabaseUrl> {
  const url = new URL(`postgresql://${host}/${COMPANY_DATABASE}?sslmode=require`)
  url.username = READ_LOGIN
  url.password = await appLoginPassword({ key: context.key, login: READ_LOGIN })
  return DatabaseUrl.parse(url.toString())
}

/** What a read of the copies gives: the rows, a refusal by the database, or a failure. */
export type SyncRead =
  | { kind: 'ROWS'; results: readonly ReadResult[] }
  | { kind: 'REFUSED'; sqlstate: string }
  | { kind: 'NO_LOGIN' }
  | { kind: 'TOO_LARGE' }
  | { kind: 'TIMEOUT' }
  | { kind: 'UNAVAILABLE'; cause?: string }

/** SQLSTATEs of a login that is not there, or whose password is not the derived one. */
const NO_LOGIN = new Set(['28000', '28P01'])

/** Classes of the call's own timeouts: `statement_timeout` and `transaction_timeout`. */
const TIMED_OUT = new Set(['57014', '25P04'])

/**
 * The statements as the read login, in one read-only transaction. What PostgreSQL refuses is
 * refused, whatever the refusal: there is no filter of ours before it.
 */
async function readCopies(
  context: Context,
  reader: DatabaseUrl,
  statements: readonly SqlStatement[],
  signal: AbortSignal,
): Promise<SyncRead> {
  const answer = await context.transport(reader, statements, signal, { readOnly: true })
  switch (answer.kind) {
    case 'READ':
      return Buffer.byteLength(JSON.stringify(answer.results.map(({ rows }) => rows))) >
        REPLY_CAP_BYTES
        ? { kind: 'TOO_LARGE' }
        : { kind: 'ROWS', results: answer.results }
    case 'TOO_LARGE':
      return { kind: 'TOO_LARGE' }
    case 'NO_ANSWER':
      return signal.aborted ? { kind: 'TIMEOUT' } : { kind: 'UNAVAILABLE', cause: answer.cause }
    case 'REFUSED':
      if (NO_LOGIN.has(answer.code)) return { kind: 'NO_LOGIN' }
      if (TIMED_OUT.has(answer.code)) return { kind: 'TIMEOUT' }
      return { kind: 'REFUSED', sqlstate: answer.code }
    default:
      return answer satisfies never
  }
}

/** A copy act of `copy-sql.ts` with the context already given. */
export type Bound<F> = F extends (context: Context, ...rest: infer A) => infer R
  ? (...rest: A) => R
  : never

/** The read login's acts with the context already given. */
export type CopyReader = {
  /** The login that reads the `sync` schema and nothing else, after `ensureSync`; repeatable. */
  ensureReader(owner: DatabaseUrl): Promise<SqlAnswer>
  /** Where the Hub reaches the read login, from the host it recorded, with no call to Neon. */
  readerAddress(host: string): Promise<DatabaseUrl>
  /** The statements as the read login, in one read-only transaction. */
  readCopies(
    reader: DatabaseUrl,
    statements: readonly SqlStatement[],
    signal: AbortSignal,
  ): Promise<SyncRead>
}

export function copyReader(context: Context): CopyReader {
  return {
    ensureReader: (owner) => ensureReader(context, owner),
    readerAddress: (host) => readerAddress(context, host),
    readCopies: (reader, statements, signal) => readCopies(context, reader, statements, signal),
  }
}
