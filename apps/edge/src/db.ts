import type { Db as AppDb, DbResult, Row } from '@conexus/app-contract'
import type { AppHost, AppSessionToken } from '@conexus/hub-api'
import { appLoginPassword, FAILURES, QUERY_SQL_MAX } from '@conexus/hub-api'
import { NeonDbError, neon } from '@neondatabase/serverless'
import type { HubPort } from './hub.ts'

/**
 * What the dispatcher binds one call's `db` to; the app reads none of it (decision 0043). The
 * login's own `search_path` names its schema, set when the login is made; `endsAt` is the instant,
 * in epoch milliseconds, the app's call reaches its deadline (decision 0047). The session and the
 * host the browser opened, `label`, name to the Hub who each query is recorded for.
 */
export type DbProps = Readonly<{
  login: string
  host: string
  database: string
  endsAt: number
  session: AppSessionToken
  label: AppHost
}>

/** Where each `query` is told to the Hub, and the Worker kept alive until it is, after the app has its answer. */
export type ReadNotices = Readonly<{
  hub: Pick<HubPort, 'recordAppRead'>
  waitUntil(promise: Promise<void>): void
}>

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

/** The query as the Registro keeps it: its first characters, never half of a surrogate pair. */
function keptQuery(text: string): string {
  const kept = text.slice(0, QUERY_SQL_MAX)
  const last = kept.charCodeAt(kept.length - 1)
  return kept.length < text.length && last >= 0xd800 && last <= 0xdbff ? kept.slice(0, -1) : kept
}

/**
 * Tells the Hub of one query, its rows counted and never sent. A notice whose outcome is unknown, no
 * answer or a refusal that does not settle, goes once more under the same id, so a lost answer leaves
 * one line; a settled refusal goes once. A line not written is logged without the query.
 */
async function told(
  hub: ReadNotices['hub'],
  props: DbProps,
  read: { text: string; answer: DbResult; ms: number },
): Promise<void> {
  const { answer } = read
  const notice = {
    ...{ host: props.label, session: props.session, id: crypto.randomUUID() },
    ...{ query: keptQuery(read.text), ms: read.ms },
    ...('rows' in answer
      ? { outcome: 'ROWS', rows: answer.rows.length }
      : { outcome: answer.error.code, rows: null }),
  }
  let answered = await hub.recordAppRead(notice)
  const settled = answered.kind === 'REFUSED' && FAILURES[answered.code].settles
  if (answered.kind !== 'DONE' && !settled) answered = await hub.recordAppRead(notice)
  if (answered.kind === 'DONE') return
  const why = answered.kind === 'REFUSED' ? { code: answered.code } : { reason: answered.reason }
  console.error(JSON.stringify({ level: 50, msg: 'EDGE_READ_UNRECORDED', ...why }))
}

/**
 * The app's `db` of one login (decision 0045): each call opens its own HTTP transaction, and the
 * password is derived from the key for it and goes only into Neon's request (decision 0043). A call
 * after the app call's deadline never reaches Neon, and one under way is cut at it (decision 0047).
 * Each `query` is told to the Hub after its answer, which never waits for it.
 */
export function dbOf(key: string, props: DbProps, notices: ReadNotices): AppDb {
  const { login, host, database, endsAt } = props
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
  /** One statement in a read-only transaction: PostgreSQL refuses a write (decision 0045). */
  async function readOnly(text: string, values: readonly unknown[]): Promise<DbResult> {
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
  }
  return {
    async query(text, values = []) {
      const started = performance.now()
      const answer = await readOnly(text, values)
      const ms = Math.round(performance.now() - started)
      notices.waitUntil(told(notices.hub, props, { text, answer, ms }))
      return answer
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
