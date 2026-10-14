import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate as applyMigrations } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'
import type { DatabaseUrl } from './database.ts'
import { databaseFailure, MIGRATIONS_FOLDER, POOL_LIMITS } from './database.ts'
import { Failure } from './failure.ts'

function passwordOf(runtimeUrl: DatabaseUrl): string {
  const password = URL.parse(runtimeUrl.reveal())?.password ?? ''
  if (password === '') {
    throw new Failure('CONFIG_INVALID', { details: { variables: 'HUB_DATABASE_URL_FILE' } })
  }
  return decodeURIComponent(password)
}

export async function migrate(deps: {
  ownerUrl: DatabaseUrl
  runtimeUrl: DatabaseUrl
}): Promise<void> {
  const password = passwordOf(deps.runtimeUrl)
  const pool = new pg.Pool({ connectionString: deps.ownerUrl.reveal(), ...POOL_LIMITS, max: 1 })
  const db = drizzle({ client: pool })
  try {
    await applyMigrations(db, { migrationsFolder: MIGRATIONS_FOLDER })
    await db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('conexus.runtime_password', ${password}, true)`)
      await tx.execute(sql`do $$ begin
        execute format('alter role hub_runtime password %L', current_setting('conexus.runtime_password'));
      end $$`)
    })
  } catch (error) {
    throw databaseFailure(error)
  } finally {
    await pool.end()
  }
}
