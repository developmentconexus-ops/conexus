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
  idleTimeoutMillis: 10_000,
  min: 0,
} as const
// The one deadline of a unit of work's replies (code C57), owned by inTransaction below.
const READ_DEADLINE_MS = 15_000

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

type Orm = NodePgDatabase & { $client: pg.Pool }
type Transaction = Parameters<Parameters<Orm['transaction']>[0]>[0]
export type ReadTx = Pick<Transaction, 'select' | 'selectDistinct' | 'execute'>
export type CommandTx = Transaction

export type Database = Readonly<{
  read<T>(work: (tx: ReadTx) => Promise<T>): Promise<T>
  command<T>(work: (tx: CommandTx) => Promise<T>): Promise<T>
  /** Only for a library's own adapter, which checks the rows it reads itself (data D19, D21). */
  libraryOrm(): Orm
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
  function lost(error: Error): void {
    logFailure(deps.log, new Failure('DATABASE_UNAVAILABLE', { cause: error }))
  }
  // An idle connection the server drops emits here; with no listener the process dies.
  pool.on('error', lost)
  let closing: Promise<void> | undefined
  const library = drizzle({ client: pool })

  /**
   * The connection is lost where it is lost: the pool cannot connect, or the client emits `error`,
   * which pg does for a dropped socket before it rejects the query. Past the read deadline the socket
   * is destroyed, so a stalled reply takes that same path; the client never returns to the pool.
   */
  async function inTransaction<T>(
    work: (tx: CommandTx) => Promise<T>,
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
    function stalled(): void {
      client.connection.stream.destroy()
    }
    client.on('error', onError)
    const deadline = AbortSignal.timeout(READ_DEADLINE_MS)
    deadline.addEventListener('abort', stalled, { once: true })
    let failure: Error | undefined
    try {
      return await drizzle({ client }).transaction(ownErrorsAreUnexpected(work), config)
    } catch (error) {
      failure = error instanceof Error ? error : new Error('transaction failed', { cause: error })
      if (lostWith === undefined) throw databaseFailure(error)
      throw new Failure('DATABASE_UNAVAILABLE', { cause: error })
    } finally {
      deadline.removeEventListener('abort', stalled)
      client.off('error', onError)
      client.release(failure)
    }
  }

  return Object.freeze({
    read: (work) =>
      inTransaction(work, { isolationLevel: 'repeatable read', accessMode: 'read only' }),
    command: (work) =>
      inTransaction(work, { isolationLevel: 'read committed', accessMode: 'read write' }),
    libraryOrm: () => library,
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

export async function assertRuntimeLogin(database: Database): Promise<void> {
  const login = await database.read(async (tx) => {
    const rows = await tx.execute(sql`select current_user as name`)
    return z.object({ name: z.string() }).parse(rows.rows[0])
  })
  if (login.name !== 'hub_runtime') {
    throw new Failure('CONFIG_INVALID', { details: { variables: 'HUB_DATABASE_URL_FILE' } })
  }
}
