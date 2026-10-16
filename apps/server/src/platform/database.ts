import { join } from 'node:path'
import type { AnyRelations, EmptyRelations } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { z } from 'zod'
import type { FailureLog } from './failure.ts'
import { Failure, logFailure } from './failure.ts'
import { Secret } from './secret.ts'

export const MIGRATIONS_FOLDER = join(import.meta.dirname, '..', '..', 'migrations')
export const POOL_LIMITS = {
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 10_000,
  min: 0,
} as const
// The one deadline of a connection's replies while it is checked out (code C57), owned by the pool
// in openDatabase below.
const READ_DEADLINE_MS = 15_000

const UNAVAILABLE_SQLSTATES = /^(08.{3}|57P0[123]|57014)$/

export type DatabaseUrl = Secret<'DatabaseUrl'>
export const DatabaseUrl = {
  parse(value: string): DatabaseUrl {
    const url = URL.parse(value)
    if (url === null || !['postgres:', 'postgresql:'].includes(url.protocol)) {
      throw new TypeError('not a PostgreSQL URL')
    }
    return new Secret('DatabaseUrl', value)
  },
}

type Orm<R extends AnyRelations = EmptyRelations> = NodePgDatabase<R> & { $client: pg.Pool }
type Transaction<R extends AnyRelations = EmptyRelations> = Parameters<
  Parameters<Orm<R>['transaction']>[0]
>[0]
export type ReadTx = Pick<Transaction, 'select' | 'selectDistinct' | 'execute'>
export type CommandTx = Transaction
type LibraryTx<R extends AnyRelations> = Transaction<R>

export type Database = Readonly<{
  read<T>(work: (tx: ReadTx) => Promise<T>): Promise<T>
  command<T>(work: (tx: CommandTx) => Promise<T>): Promise<T>
  /**
   * Only for a library's own adapter, which checks the rows it reads itself (data D19, D21). The
   * relations are the library's, so its joins run as one query each.
   */
  libraryOrm<R extends AnyRelations>(relations: R): Orm<R>
  /** A command whose transaction carries the library's relations, for its adapter to join on. */
  libraryCommand<R extends AnyRelations, T>(
    relations: R,
    work: (tx: LibraryTx<R>) => Promise<T>,
  ): Promise<T>
  close(): Promise<void>
}>

/** A database error is mapped by its SQLSTATE (code C52); any other error is the program's. */
export function databaseFailure(error: unknown): Failure {
  if (error instanceof Failure) return error
  for (let cause = error; cause instanceof Error; cause = cause.cause) {
    if (cause instanceof pg.DatabaseError) {
      const unavailable = UNAVAILABLE_SQLSTATES.test(cause.code ?? '')
      return new Failure(unavailable ? 'DATABASE_UNAVAILABLE' : 'INTERNAL_UNEXPECTED', { cause })
    }
  }
  return new Failure('INTERNAL_UNEXPECTED', { cause: error })
}

/**
 * Makes a second command on the same key wait for the first one's transaction to end (code C65).
 * The key is hashed to the 64 bits of an advisory lock.
 */
export async function transactionLock(tx: CommandTx, key: string): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`)
}

const NO_RELATIONS: EmptyRelations = {}
const WRITE = { isolationLevel: 'read committed', accessMode: 'read write' } as const

export function openDatabase(deps: { url: DatabaseUrl; log: FailureLog }): Database {
  const pool = new pg.Pool({ connectionString: deps.url.reveal(), ...POOL_LIMITS })
  function lost(error: Error): void {
    logFailure(deps.log, new Failure('DATABASE_UNAVAILABLE', { cause: error }))
  }
  // An idle connection the server drops emits here; with no listener the process dies.
  pool.on('error', lost)
  // Every checkout, a transaction's or one library query's, gets the deadline: past it the socket
  // is destroyed, so a stalled reply fails as a dropped connection does and the pool drops the client.
  const deadlines = new Map<pg.PoolClient, NodeJS.Timeout>()
  pool.on('acquire', (client) => {
    const stalled = setTimeout(() => client.connection.stream.destroy(), READ_DEADLINE_MS)
    deadlines.set(client, stalled.unref())
  })
  pool.on('release', (_error, client) => {
    clearTimeout(deadlines.get(client))
    deadlines.delete(client)
  })
  let closing: Promise<void> | undefined

  /**
   * The connection is lost where it is lost: the pool cannot connect, or the client emits `error`,
   * which pg does for a dropped socket before it rejects the query, a stalled one included; the
   * client never returns to the pool.
   */
  async function inTransaction<R extends AnyRelations, T>(
    relations: R,
    work: (tx: LibraryTx<R>) => Promise<T>,
    config: {
      isolationLevel: 'repeatable read' | 'read committed'
      accessMode: 'read only' | 'read write'
    },
  ): Promise<T> {
    let client: pg.PoolClient
    try {
      client = await pool.connect()
    } catch (error) {
      throw new Failure('DATABASE_UNAVAILABLE', { cause: error })
    }
    let lostWith: Error | undefined
    function onError(error: Error): void {
      lostWith = error
      lost(error)
    }
    client.on('error', onError)
    try {
      return await drizzle({ client, relations }).transaction(work, config)
    } catch (error) {
      if (lostWith === undefined) throw databaseFailure(error)
      throw new Failure('DATABASE_UNAVAILABLE', { cause: error })
    } finally {
      client.off('error', onError)
      // A refusal rolls the transaction back and the connection goes back to the pool; a lost one,
      // the deadline's included, has a destroyed socket, and pg-pool removes it on release.
      client.release()
    }
  }

  return Object.freeze({
    read: (work) =>
      inTransaction(NO_RELATIONS, work, {
        isolationLevel: 'repeatable read',
        accessMode: 'read only',
      }),
    command: (work) => inTransaction(NO_RELATIONS, work, WRITE),
    libraryOrm: (relations) => drizzle({ client: pool, relations }),
    libraryCommand: (relations, work) => inTransaction(relations, work, WRITE),
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
  const hashByName = new Map(applied.map((row) => [row.name, row.hash]))
  const missing = shipped.filter((migration) => !hashByName.has(migration.name))
  if (missing.length > 0) {
    throw new Failure('DATABASE_BEHIND', { details: { missing: missing.length } })
  }
  const changed = shipped.filter((migration) => hashByName.get(migration.name) !== migration.hash)
  if (changed.length > 0) {
    throw new Failure('DATABASE_MIGRATION_CHANGED', {
      details: { changed: changed.map((migration) => migration.name).join(',') },
    })
  }
}

export const RUNTIME_LOGIN = 'hub_runtime'

export async function assertRuntimeLogin(database: Database): Promise<void> {
  const login = await database.read(async (tx) => {
    const rows = await tx.execute(sql`select current_user as name`)
    return z.object({ name: z.string() }).parse(rows.rows[0])
  })
  if (login.name !== RUNTIME_LOGIN) {
    throw new Failure('CONFIG_INVALID', { details: { variables: 'HUB_DATABASE_URL_FILE' } })
  }
}
