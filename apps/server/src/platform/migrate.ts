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

async function connected(url: string): Promise<pg.Client> {
  const client = new pg.Client({
    connectionString: url,
    connectionTimeoutMillis: POOL_LIMITS.connectionTimeoutMillis,
  })
  await client.connect().catch(async (error: unknown) => {
    await client.end().catch(() => undefined)
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
    await client.end().catch(() => undefined)
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
async function prepareMastraDatabase(hub: pg.Client, ownerUrl: DatabaseUrl, mastra: Login) {
  const name = pg.escapeIdentifier(mastra.database)
  const found = await hub.query('select 1 from pg_database where datname = $1', [mastra.database])
  if (found.rowCount === 0) await hub.query(`create database ${name}`)
  const url = new URL(ownerUrl.reveal())
  url.pathname = `/${encodeURIComponent(mastra.database)}`
  const client = await connected(url.toString())
  try {
    await client.query(`revoke connect on database ${name} from public`)
    await client.query(`grant connect, create on database ${name} to ${MASTRA_LOGIN}`)
  } finally {
    await client.end().catch(() => undefined)
  }
}

export async function migrate(deps: {
  ownerUrl: DatabaseUrl
  runtimeUrl: DatabaseUrl
  mastraUrl: DatabaseUrl
  migrationsFolder?: string
}): Promise<void> {
  const runtime = loginOf(deps.runtimeUrl, RUNTIME_LOGIN, 'HUB_DATABASE_URL_FILE')
  const mastra = loginOf(deps.mastraUrl, MASTRA_LOGIN, 'HUB_MASTRA_DATABASE_URL_FILE')
  // Option B of the founder's choice, Mastra inside the Hub's database, is the one refused.
  if (mastra.database === runtime.database || mastra.host !== runtime.host) {
    throw new Failure('CONFIG_INVALID', { details: { variables: 'HUB_MASTRA_DATABASE_URL_FILE' } })
  }
  const client = await connected(deps.ownerUrl.reveal())
  try {
    const db = drizzle({ client })
    await applyMigrations(db, { migrationsFolder: deps.migrationsFolder ?? MIGRATIONS_FOLDER })
    await prepareMastraDatabase(client, deps.ownerUrl, mastra)
    await setPassword(db, runtime)
    await setPassword(db, mastra)
  } catch (error) {
    throw databaseFailure(error)
  } finally {
    await client.end().catch(() => undefined)
  }
}
