import { sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate as applyMigrations } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'
import type { DatabaseUrl } from './database.ts'
import {
  databaseFailure,
  MASTRA_LOGIN,
  MIGRATIONS_FOLDER,
  POOL_LIMITS,
  RUNTIME_LOGIN,
} from './database.ts'
import { Failure } from './failure.ts'

const INVALID_PASSWORD = '28P01'
const LOCK_NOT_AVAILABLE = '55P03'

/**
 * How a migration that did not finish ended; the name is the `reason` of the logged failure.
 * `LOCK_BUSY` and `CONNECTION_LOST` are retryable, `TOO_LONG` is not: trying again would hold the
 * migration's tables for as long again.
 */
const MIGRATE_OUTCOMES = ['LOCK_BUSY', 'CONNECTION_LOST', 'TOO_LONG'] as const
type MigrateOutcome = (typeof MIGRATE_OUTCOMES)[number]

/** The exit status that tells deploy.sh to try again (sysexits EX_TEMPFAIL); any other failure is 1. */
export const MIGRATE_RETRY_EXIT = 75

/**
 * The limits of the migration's own connection, which the Postgres enforces; killing the process
 * ends none of them (a `timeout` leaves the SQL running). Each number is the founder's answer of
 * 2026-10-22 to a study of the deploy, with this basis:
 * - lock wait 5 s: under the 10 s at which the Hub's own requests give up (`hub_runtime`'s
 *   statement_timeout), so the queue behind a waiting DDL drains in time; the range in use is 50 ms
 *   (Postgres.ai) to 10 s (the setting strong_migrations recommends, README.md:963-966);
 * - transaction 60 s: the 60 s the deploy allowed the whole process before, now enforced in the
 *   server; it covers the largest rewrite measured (3 million rows retyped and updated, 11.5 s);
 * - connection check 1 s: where the setting reaches the server, it notices a dead client within a
 *   second and rolls back; without it "the server will detect the loss of the connection only at
 *   the next interaction with the socket" (PostgreSQL 18, runtime-config-connection). Through
 *   Neon's proxy this one is the deepened study's open hypothesis, not a proved fact.
 */
const MIGRATE_LIMITS: MigrateLimits = {
  lockTimeoutMs: 5_000,
  transactionTimeoutMs: 60_000,
  connectionCheckIntervalMs: 1_000,
}
// Neon: "Set a connection timeout of at least 10-15 seconds" (building resilient applications with
// Postgres), since the compute of a database at rest takes seconds to wake (data D27).
const CONNECT_TIMEOUT_MS = 15_000

type MigrateLimits = {
  readonly lockTimeoutMs: number
  readonly transactionTimeoutMs: number
  readonly connectionCheckIntervalMs: number
}

/**
 * Through `options` and not as `pg` parameters: the Neon proxy forwards `options` and drops the
 * loose startup parameters `pg` sends for `lock_timeout` (first study's addendum, a live `SHOW`).
 * A local Postgres accepts both ways, so only this form is safe in production.
 */
function limitOptions(limits: MigrateLimits): string {
  return [
    `lock_timeout=${limits.lockTimeoutMs / 1000}s`,
    `transaction_timeout=${limits.transactionTimeoutMs / 1000}s`,
    `client_connection_check_interval=${limits.connectionCheckIntervalMs / 1000}s`,
  ]
    .map((setting) => `-c ${setting}`)
    .join(' ')
}

type Login = { url: DatabaseUrl; name: string; password: string; database: string; host: string }

function loginOf(url: DatabaseUrl, name: string, variable: string): Login {
  const parsed = URL.parse(url.reveal())
  const password = decodeURIComponent(parsed?.password ?? '')
  const database = decodeURIComponent(parsed?.pathname.slice(1) ?? '')
  if (password === '' || database === '' || decodeURIComponent(parsed?.username ?? '') !== name) {
    throw new Failure('CONFIG_INVALID', { details: { variables: variable } })
  }
  return { url, name, password, database, host: parsed?.host ?? '' }
}

/** Closes a connection while another result or failure is on its way; a close error must not replace it. */
async function closed(client: pg.Client): Promise<void> {
  // biome-ignore lint/plugin: a failed close must not replace the result or failure being returned (C53)
  await client.end().catch(() => undefined)
}

/** A connection of the migration; the server ending it is recorded in `session`, never an unhandled event. */
async function connected(
  url: string,
  session: { lost: boolean },
  options?: string,
): Promise<pg.Client> {
  const client = new pg.Client({
    connectionString: url,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    ...(options === undefined ? {} : { options }),
  })
  client.on('error', () => {
    session.lost = true
  })
  await client.connect().catch(async (error: unknown) => {
    await closed(client)
    throw new Failure('DATABASE_UNAVAILABLE', { cause: error })
  })
  return client
}

// A password already accepted is left alone: ALTER ROLE stores a verifier with a fresh salt each time.
async function loginRefused(login: Login): Promise<boolean> {
  const client = new pg.Client({
    connectionString: login.url.reveal(),
    connectionTimeoutMillis: POOL_LIMITS.connectionTimeoutMillis,
  })
  try {
    await client.connect()
    return false
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === INVALID_PASSWORD) return true
    throw new Failure('DATABASE_UNAVAILABLE', { cause: error })
  } finally {
    await closed(client)
  }
}

async function setPassword(db: NodePgDatabase, login: Login): Promise<void> {
  if (!(await loginRefused(login))) return
  await db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('conexus.login', ${login.name}, true),
      set_config('conexus.login_password', ${login.password}, true)`)
    await tx.execute(sql`do $$ begin
      execute format('alter role %I password %L', current_setting('conexus.login'),
        current_setting('conexus.login_password'));
    end $$`)
  })
}

/**
 * Mastra's own database, beside the Hub's on the same server (decision 0010): made once, open to
 * Mastra's login alone, which creates its tables there at start. CREATE DATABASE cannot run in a
 * transaction, so no migration holds it (data D5).
 */
async function prepareMastraDatabase(
  hub: pg.Client,
  ownerUrl: DatabaseUrl,
  mastra: Login,
  session: { lost: boolean },
  limits: MigrateLimits,
) {
  const name = pg.escapeIdentifier(mastra.database)
  const found = await hub.query('select 1 from pg_database where datname = $1', [mastra.database])
  if (found.rowCount === 0) await hub.query(`create database ${name}`)
  const url = new URL(ownerUrl.reveal())
  url.pathname = `/${encodeURIComponent(mastra.database)}`
  const client = await connected(url.toString(), session, limitOptions(limits))
  try {
    await client.query(`revoke connect on database ${name} from public`)
    await client.query(`grant connect, create on database ${name} to ${MASTRA_LOGIN}`)
  } finally {
    await closed(client)
  }
}

function hasSqlstate(error: unknown, test: (code: string) => boolean): boolean {
  for (let cause = error; cause instanceof Error; cause = cause.cause) {
    if (cause instanceof pg.DatabaseError && test(cause.code ?? '')) return true
  }
  return false
}

/**
 * Names how the migration ended, or nothing when the error is not one of the three. A lost
 * connection is `pg`'s 'error' event, which fires before the query that was running rejects, so
 * Drizzle's "Connection terminated unexpectedly" masking of 25P04 and 57P01 does not hide it. Neon
 * restarting the compute or the network is retryable, since one transaction applies all or nothing.
 * Once the attempt has spent the transaction limit, or all of it but the last lock wait (a busy
 * lock there is indistinguishable from the limit), the migration is too long for a deploy.
 */
function outcomeOf(
  error: unknown,
  session: { lost: boolean },
  elapsedMs: number,
  limits: MigrateLimits,
): MigrateOutcome | undefined {
  const busy = hasSqlstate(error, (code) => code === LOCK_NOT_AVAILABLE)
  if (!busy && !session.lost) return undefined
  if (elapsedMs >= limits.transactionTimeoutMs - (busy ? limits.lockTimeoutMs : 0))
    return 'TOO_LONG'
  return busy ? 'LOCK_BUSY' : 'CONNECTION_LOST'
}

function namedFailure(error: unknown, outcome: MigrateOutcome | undefined): Failure {
  if (outcome === undefined) return databaseFailure(error)
  const code = outcome === 'TOO_LONG' ? 'INTERNAL_UNEXPECTED' : 'DATABASE_UNAVAILABLE'
  return new Failure(code, { details: { reason: outcome }, cause: error })
}

/** The exit status of a failed command: the retryable outcomes of `migrate` tell the deploy to try again. */
export function migrateExitCode(failure: Failure): number {
  const outcome = MIGRATE_OUTCOMES.find((name) => name === failure.details.reason)
  if (outcome === undefined) return 1
  switch (outcome) {
    case 'LOCK_BUSY':
    case 'CONNECTION_LOST':
      return MIGRATE_RETRY_EXIT
    case 'TOO_LONG':
      return 1
    default:
      return outcome satisfies never
  }
}

export async function migrate(deps: {
  ownerUrl: DatabaseUrl
  runtimeUrl: DatabaseUrl
  mastraUrl: DatabaseUrl
  migrationsFolder?: string
  limits?: MigrateLimits
}): Promise<void> {
  const limits = deps.limits ?? MIGRATE_LIMITS
  const runtime = loginOf(deps.runtimeUrl, RUNTIME_LOGIN, 'HUB_DATABASE_URL_FILE')
  const mastra = loginOf(deps.mastraUrl, MASTRA_LOGIN, 'HUB_MASTRA_DATABASE_URL_FILE')
  // Option B of the founder's choice, Mastra inside the Hub's database, is the one refused.
  if (mastra.database === runtime.database || mastra.host !== runtime.host) {
    throw new Failure('CONFIG_INVALID', { details: { variables: 'HUB_MASTRA_DATABASE_URL_FILE' } })
  }
  // An `options` in the URL would replace the limits' (pg merges the URL over the config).
  if (new URL(deps.ownerUrl.reveal()).searchParams.has('options')) {
    throw new Failure('CONFIG_INVALID', {
      details: { variables: 'HUB_MIGRATION_DATABASE_URL_FILE' },
    })
  }
  const session = { lost: false }
  const client = await connected(deps.ownerUrl.reveal(), session, limitOptions(limits))
  const started = Date.now()
  try {
    const db = drizzle({ client })
    await applyMigrations(db, { migrationsFolder: deps.migrationsFolder ?? MIGRATIONS_FOLDER })
    await prepareMastraDatabase(client, deps.ownerUrl, mastra, session, limits)
    await setPassword(db, runtime)
    await setPassword(db, mastra)
  } catch (error) {
    throw namedFailure(error, outcomeOf(error, session, Date.now() - started, limits))
  } finally {
    await closed(client)
  }
}
