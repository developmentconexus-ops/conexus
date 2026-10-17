import { join } from 'node:path'
import type { CompanyId, InvitationId, PersonId } from '@conexus/hub-api'
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

/**
 * Whose rows a transaction reaches (decision 0039): its kind sets the role, and its ids the values
 * the row policies read. The caller takes it from the session or from a proof, never from a body.
 */
export type Scope =
  | { kind: 'COMPANY'; companyId: CompanyId; personId: PersonId }
  | { kind: 'PERSON'; personId: PersonId }
  | { kind: 'INVITATION'; invitationId: InvitationId; personId: PersonId | null }
  | { kind: 'OPERATOR'; personId: PersonId; companyId: CompanyId | null }

// Constants of the program, so the role is never a value from outside (data D20).
export const SCOPE_ROLES = {
  COMPANY: 'hub_company',
  PERSON: 'hub_person',
  INVITATION: 'hub_invitation',
  OPERATOR: 'hub_operator',
} as const satisfies Record<Scope['kind'], string>

const SETTINGS = {
  companyId: 'conexus.company_id',
  personId: 'conexus.person_id',
  invitationId: 'conexus.invitation_id',
} as const

function setting(name: string) {
  return sql.raw(`nullif(current_setting('${name}', true), '')`)
}

/** What a row policy reads of its transaction's scope: nothing, when the scope has no such id. */
export const scoped = {
  companyId: setting(SETTINGS.companyId),
  personId: setting(SETTINGS.personId),
  invitationId: setting(SETTINGS.invitationId),
}

export type Database = Readonly<{
  read<T>(scope: Scope, work: (tx: ReadTx) => Promise<T>): Promise<T>
  command<T>(scope: Scope, work: (tx: CommandTx) => Promise<T>): Promise<T>
  /**
   * For a library's own adapter outside a transaction, which checks the rows it reads itself (data
   * D19, D21): sessions, accounts and people, never a company's tables. The relations are the
   * library's, so its joins run as one query each.
   */
  libraryOrm<R extends AnyRelations>(relations: R): Orm<R>
  /** A command whose transaction carries the library's relations, for its adapter to join on. */
  libraryCommand<R extends AnyRelations, T>(
    relations: R,
    scope: Scope,
    work: (tx: LibraryTx<R>) => Promise<T>,
  ): Promise<T>
  /**
   * The person's own scope inside a company command, and back, for the invitation pace, which counts
   * what the person sent in every company.
   */
  asPerson<T>(tx: CommandTx, work: (tx: CommandTx) => Promise<T>): Promise<T>
  /** The installation's own rows, in the Hub's login: its starts, and the checks of the boot. */
  installation<T>(work: (tx: CommandTx) => Promise<T>): Promise<T>
  /** The installation's own rows, read only: the status page's starts. */
  installationRead<T>(work: (tx: ReadTx) => Promise<T>): Promise<T>
  /** The installation's first administrator, before any person exists to scope a command. */
  libraryInstallation<R extends AnyRelations, T>(
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

/** The constraint a unique violation (23505) names, read by SQLSTATE and name (code C52). */
export function violatedConstraint(error: unknown): string | undefined {
  for (let cause = error; cause instanceof Error; cause = cause.cause) {
    if (cause instanceof pg.DatabaseError) {
      return cause.code === '23505' ? cause.constraint : undefined
    }
  }
  return undefined
}

/**
 * Makes a second command on the same key wait for the first one's transaction to end (code C65).
 * The key is hashed to the 64 bits of an advisory lock.
 */
export async function transactionLock(tx: CommandTx, key: string): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`)
}

const NO_RELATIONS: EmptyRelations = {}
const READ = { isolationLevel: 'repeatable read', accessMode: 'read only' } as const
const WRITE = { isolationLevel: 'read committed', accessMode: 'read write' } as const

/** The values the row policies read, each bound and local to the transaction (data D20, D25). */
async function enter(tx: CommandTx, scope: Scope): Promise<void> {
  const companyId = 'companyId' in scope ? (scope.companyId ?? '') : ''
  const invitationId = scope.kind === 'INVITATION' ? scope.invitationId : ''
  try {
    await tx.execute(sql.raw(`set local role ${SCOPE_ROLES[scope.kind]}`))
    await tx.execute(sql`select set_config(${SETTINGS.companyId}, ${companyId}, true),
      set_config(${SETTINGS.personId}, ${scope.personId ?? ''}, true),
      set_config(${SETTINGS.invitationId}, ${invitationId}, true)`)
  } catch (error) {
    // Nothing runs outside its scope: a transaction that cannot enter it ends here.
    throw new Failure('DATABASE_UNAVAILABLE', { cause: error })
  }
}

/**
 * Runs `work` as the person of the company scope `tx` entered, then enters that scope again. After a
 * database error the transaction is aborted, re-entry fails, and the first failure is the one that
 * tells why; otherwise a caller that goes on is back in the company's scope.
 */
async function asPersonIn<T>(
  scope: Scope | undefined,
  tx: CommandTx,
  work: (tx: CommandTx) => Promise<T>,
): Promise<T> {
  if (scope?.kind !== 'COMPANY') {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'asPerson outside COMPANY' } })
  }
  await enter(tx, { kind: 'PERSON', personId: scope.personId })
  let result: T
  try {
    result = await work(tx)
  } catch (error) {
    await enter(tx, scope).catch(() => undefined)
    throw error
  }
  await enter(tx, scope)
  return result
}
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
  // The scope each open transaction entered, for asPerson to come back to.
  const scopes = new WeakMap<CommandTx, Scope>()

  /**
   * The connection is lost where it is lost: the pool cannot connect, or the client emits `error`,
   * which pg does for a dropped socket before it rejects the query, a stalled one included; the
   * client never returns to the pool.
   */
  async function inTransaction<R extends AnyRelations, T>(
    relations: R,
    scope: Scope | undefined,
    work: (tx: LibraryTx<R>) => Promise<T>,
    config: typeof READ | typeof WRITE,
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
      return await drizzle({ client, relations }).transaction(async (tx) => {
        if (scope === undefined) return work(tx)
        await enter(tx, scope)
        scopes.set(tx, scope)
        return work(tx)
      }, config)
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
    read: (scope, work) => inTransaction(NO_RELATIONS, scope, work, READ),
    command: (scope, work) => inTransaction(NO_RELATIONS, scope, work, WRITE),
    libraryOrm: (relations) => drizzle({ client: pool, relations }),
    libraryCommand: (relations, scope, work) => inTransaction(relations, scope, work, WRITE),
    asPerson: (tx, work) => asPersonIn(scopes.get(tx), tx, work),
    installation: (work) => inTransaction(NO_RELATIONS, undefined, work, WRITE),
    installationRead: (work) => inTransaction(NO_RELATIONS, undefined, work, READ),
    libraryInstallation: (relations, work) => inTransaction(relations, undefined, work, WRITE),
    close: () => {
      closing ??= pool.end()
      return closing
    },
  })
}

const AppliedMigration = z.object({ name: z.string().nullable(), hash: z.string() })

export async function assertMigrated(database: Database): Promise<void> {
  const shipped = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER })
  const applied = await database.installation(async (tx) => {
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
  const login = await database.installation(async (tx) => {
    const rows = await tx.execute(sql`select current_user as name`)
    return z.object({ name: z.string() }).parse(rows.rows[0])
  })
  if (login.name !== RUNTIME_LOGIN) {
    throw new Failure('CONFIG_INVALID', { details: { variables: 'HUB_DATABASE_URL_FILE' } })
  }
}
