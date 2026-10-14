import { once } from 'node:events'
import { join } from 'node:path'
import { sql } from 'drizzle-orm'
import { DrizzleQueryError } from 'drizzle-orm/errors'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { z } from 'zod'
import type { FailureLog } from './failure.ts'
import { Failure, logFailure } from './failure.ts'

export const MIGRATIONS_FOLDER = join(import.meta.dirname, '..', '..', 'migrations')
export const POOL_LIMITS = {
  connectionTimeoutMillis: 5_000,
  query_timeout: 15_000,
  idleTimeoutMillis: 10_000,
  min: 0,
} as const

const UNAVAILABLE_SQLSTATES = /^(08.{3}|57P0[123]|57014)$/

export class DatabaseUrl {
  readonly #value: string

  private constructor(value: string) {
    this.#value = value
  }

  static parse(value: string): DatabaseUrl {
    const url = URL.parse(value)
    if (url === null || !['postgres:', 'postgresql:'].includes(url.protocol)) {
      throw new TypeError('not a PostgreSQL URL')
    }
    return new DatabaseUrl(value)
  }

  reveal(): string {
    return this.#value
  }

  toString(): string {
    return '[DatabaseUrl]'
  }

  toJSON(): string {
    return '[DatabaseUrl]'
  }
}

type Orm = NodePgDatabase
type Transaction = Parameters<Parameters<Orm['transaction']>[0]>[0]
export type ReadTx = Pick<Transaction, 'select' | 'selectDistinct' | 'execute'>
export type CommandTx = Transaction

export type Database = Readonly<{
  read<T>(work: (tx: ReadTx) => Promise<T>): Promise<T>
  command<T>(work: (tx: CommandTx) => Promise<T>): Promise<T>
  whenIdle(): Promise<void>
  close(): Promise<void>
}>

export function databaseFailure(error: unknown): Failure {
  if (error instanceof Failure) return error
  for (let cause = error; cause instanceof Error; cause = cause.cause) {
    if (cause instanceof pg.DatabaseError) {
      const unavailable = UNAVAILABLE_SQLSTATES.test(cause.code ?? '')
      return new Failure(unavailable ? 'DATABASE_UNAVAILABLE' : 'INTERNAL_UNEXPECTED', { cause })
    }
  }
  return new Failure('DATABASE_UNAVAILABLE', { cause: error })
}

function ownErrorsAreUnexpected<Tx, T>(work: (tx: Tx) => Promise<T>) {
  return async (tx: Tx): Promise<T> => {
    try {
      return await work(tx)
    } catch (error) {
      if (error instanceof DrizzleQueryError || error instanceof Failure) throw error
      throw new Failure('INTERNAL_UNEXPECTED', { cause: error })
    }
  }
}

export function openDatabase(deps: { url: DatabaseUrl; log: FailureLog }): Database {
  const pool = new pg.Pool({ connectionString: deps.url.reveal(), ...POOL_LIMITS })
  // An idle connection the server drops emits here; with no listener the process dies.
  pool.on('error', (error) =>
    logFailure(deps.log, new Failure('DATABASE_UNAVAILABLE', { cause: error })),
  )
  const orm: Orm = drizzle({ client: pool })
  let closing: Promise<void> | undefined

  async function run<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work()
    } catch (error) {
      throw databaseFailure(error)
    }
  }

  return Object.freeze({
    read: (work) =>
      run(() =>
        orm.transaction(ownErrorsAreUnexpected(work), {
          isolationLevel: 'repeatable read',
          accessMode: 'read only',
        }),
      ),
    command: (work) =>
      run(() =>
        orm.transaction(ownErrorsAreUnexpected(work), {
          isolationLevel: 'read committed',
          accessMode: 'read write',
        }),
      ),
    whenIdle: async () => {
      while (pool.totalCount > 0) await once(pool, 'remove')
    },
    close: () => {
      closing ??= pool.end()
      return closing
    },
  })
}

const AppliedMigration = z.object({ name: z.string().nullable(), hash: z.string() })

export async function assertMigrated(database: Database): Promise<void> {
  const shipped = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER })
  const applied = await database.read(async (tx) => {
    const table = await tx.execute(sql`select to_regclass('drizzle.__drizzle_migrations') as name`)
    if (table.rows[0]?.name == null) return []
    const rows = await tx.execute(sql`select name, hash from drizzle.__drizzle_migrations`)
    return rows.rows.map((row) => AppliedMigration.parse(row))
  })
  const have = new Set(applied.map((row) => `${row.name}:${row.hash}`))
  const missing = shipped.filter((migration) => !have.has(`${migration.name}:${migration.hash}`))
  if (missing.length > 0) {
    throw new Failure('DATABASE_BEHIND', { details: { missing: missing.length } })
  }
}
