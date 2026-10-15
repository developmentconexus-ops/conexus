import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate as applyMigrations } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'
import type { DatabaseUrl } from './database.ts'
import { databaseFailure, MIGRATIONS_FOLDER, POOL_LIMITS } from './database.ts'
import { Failure } from './failure.ts'

const RUNTIME_LOGIN = 'hub_runtime'
const INVALID_PASSWORD = '28P01'

function passwordOf(runtimeUrl: DatabaseUrl): string {
  const url = URL.parse(runtimeUrl.reveal())
  const password = url?.password ?? ''
  if (password === '' || decodeURIComponent(url?.username ?? '') !== RUNTIME_LOGIN) {
    throw new Failure('CONFIG_INVALID', { details: { variables: 'HUB_DATABASE_URL_FILE' } })
  }
  return decodeURIComponent(password)
}

// A password already accepted is left alone: ALTER ROLE stores a verifier with a fresh salt each time.
async function loginRefused(runtimeUrl: DatabaseUrl): Promise<boolean> {
  const client = new pg.Client({
    connectionString: runtimeUrl.reveal(),
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

export async function migrate(deps: {
  ownerUrl: DatabaseUrl
  runtimeUrl: DatabaseUrl
  migrationsFolder?: string
}): Promise<void> {
  const password = passwordOf(deps.runtimeUrl)
  const client = new pg.Client({
    connectionString: deps.ownerUrl.reveal(),
    connectionTimeoutMillis: POOL_LIMITS.connectionTimeoutMillis,
  })
  try {
    await client.connect().catch((error: unknown) => {
      throw new Failure('DATABASE_UNAVAILABLE', { cause: error })
    })
    const db = drizzle({ client })
    await applyMigrations(db, { migrationsFolder: deps.migrationsFolder ?? MIGRATIONS_FOLDER })
    if (!(await loginRefused(deps.runtimeUrl))) return
    await db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('conexus.runtime_password', ${password}, true)`)
      await tx.execute(sql`do $$ begin
        execute format('alter role hub_runtime password %L', current_setting('conexus.runtime_password'));
      end $$`)
    })
  } catch (error) {
    throw databaseFailure(error)
  } finally {
    await client.end().catch(() => undefined)
  }
}
