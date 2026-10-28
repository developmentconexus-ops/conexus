import { createHash, randomUUID } from 'node:crypto'
import type { ProjectId } from '@conexus/hub-api'
import { appLogin, appLoginPassword } from '@conexus/hub-api'
import pg from 'pg'
import type { SqlAnswer, SqlStatement } from './company-postgres.ts'
import { answerOf, createCompanyPostgres } from './company-postgres.ts'
import type { AppLoginKey } from './config.ts'
import { readTestDatabase } from './config.ts'
import { DatabaseUrl } from './database.ts'
import { loadMigrationRule } from './migration-rule.ts'
import type { Lifetime } from './test-database.ts'
import { withRoleLock } from './test-database.ts'
import { PREVIOUS_VERSION } from './test-migration-cases.ts'

// The test Hub's migrations read the fixed list as the Hub's start leaves it (`main.ts`).
await loadMigrationRule()

/**
 * The tests' transport (T19): one connection and one transaction per call, as Neon's HTTP proxy
 * runs it, on the test server's PostgreSQL.
 */
export async function pgTransport(
  url: DatabaseUrl,
  statements: readonly SqlStatement[],
  signal: AbortSignal,
): Promise<SqlAnswer> {
  const client = new pg.Client({ connectionString: url.reveal() })
  function abort() {
    void client.end()
  }
  signal.addEventListener('abort', abort)
  try {
    await client.connect()
    await client.query('BEGIN')
    const value = []
    for (const statement of statements) {
      value.push((await client.query(statement.text, [...(statement.values ?? [])])).rows)
    }
    await client.query('COMMIT')
    return { kind: 'DONE', value }
  } catch (error) {
    return answerOf(error instanceof pg.DatabaseError ? error.code : undefined)
  } finally {
    signal.removeEventListener('abort', abort)
    await client.end().catch(() => undefined)
  }
}

/**
 * A company's database on the test server, as Neon makes one: its owner may create logins but is
 * no superuser. The apps' logins belong to the whole server, so they go with the database.
 */
export async function createCompanyDatabase(t: Lifetime): Promise<DatabaseUrl> {
  const serverUrl = readTestDatabase().ownerUrl
  const name = `conexus_company_${randomUUID().replaceAll('-', '')}`
  const admin = new pg.Client({ connectionString: serverUrl.reveal() })
  await admin.connect()
  await admin.query(`create database ${name}`)
  const url = new URL(serverUrl.reveal())
  url.pathname = `/${name}`
  const owner = DatabaseUrl.parse(url.toString())
  t.after(async () => {
    try {
      const company = new pg.Client({ connectionString: owner.reveal() })
      await company.connect()
      const roles = await company.query(
        `select rolname from pg_roles where rolname like 'app\\_%\\_run' or rolname like 'app\\_%\\_migrate'`,
      )
      await company.end()
      await admin.query(`drop database ${name}`)
      await withRoleLock(async () => {
        for (const { rolname } of roles.rows) {
          // Logins belong to the whole server: one another test's database still uses stays for it.
          await admin
            .query(`drop role if exists "${String(rolname).replaceAll('"', '""')}"`)
            .catch((error: unknown) => {
              if (!(error instanceof pg.DatabaseError && error.code === '2BP01')) throw error
            })
        }
      })
    } finally {
      await admin.end()
    }
  })
  return owner
}

/** The tables of a Projeto's app in its company's database, and the migrations its ledger holds. */
export async function appTablesOf(owner: DatabaseUrl, projectId: ProjectId) {
  const { schema, migrateLogin } = appLogin(projectId)
  const client = new pg.Client({ connectionString: owner.reveal() })
  await client.connect()
  try {
    const tables = await client.query(
      'select tablename from pg_tables where schemaname = $1 order by 1',
      [schema],
    )
    const names = tables.rows.map((row) => String(row.tablename))
    // The owner holds the migration login by SET alone: the ledger is that login's to read.
    if (names.includes('conexus_migration')) await client.query(`set role "${migrateLogin}"`)
    const ledger = names.includes('conexus_migration')
      ? await client.query(`select id from "${schema}".conexus_migration order by id`)
      : { rows: [] }
    return { tables: names, ledger: ledger.rows.map((row) => String(row.id)) }
  } finally {
    await client.end()
  }
}

/** As the migration login, which the owner holds by SET alone: the app's schema is its to read. */
async function asMigrateLogin<T>(
  owner: DatabaseUrl,
  projectId: ProjectId,
  act: (client: pg.Client) => Promise<T>,
) {
  const { schema, migrateLogin } = appLogin(projectId)
  const client = new pg.Client({ connectionString: owner.reveal() })
  await client.connect()
  try {
    await client.query('begin')
    await client.query(`set local role "${migrateLogin}"`)
    await client.query(`set local search_path = "${schema}"`)
    const done = await act(client)
    await client.query('commit')
    return done
  } finally {
    await client.end()
  }
}

/** Everything the app's schema keeps: each table, the ledger included, with its rows in order. */
export function savedOf(owner: DatabaseUrl, projectId: ProjectId) {
  return asMigrateLogin(owner, projectId, async (client) => {
    const tables = await client.query(
      "select relname from pg_class where relnamespace = quote_ident(current_schema())::regnamespace and relkind = 'r' order by 1",
    )
    const saved: Record<string, unknown[]> = {}
    for (const { relname } of tables.rows) {
      const name = `"${String(relname).replaceAll('"', '""')}"`
      saved[relname] = (await client.query(`select * from ${name} order by 1`)).rows
    }
    return saved
  })
}

/** Applies a migration without the fixed list or the outcome check: its statements, its ledger row. */
export function plantApplied(
  owner: DatabaseUrl,
  projectId: ProjectId,
  migration: { id: string; statements: string[] },
) {
  const sha256 = createHash('sha256').update(JSON.stringify(migration.statements)).digest('hex')
  return asMigrateLogin(owner, projectId, async (client) => {
    for (const text of migration.statements) await client.query(text)
    await client.query('insert into conexus_migration (id, sha256) values ($1, $2)', [
      migration.id,
      sha256,
    ])
  })
}

/** The previous version's reads and writes as the run login, undone after: none refused. */
export async function previousVersionOf(
  owner: DatabaseUrl,
  projectId: ProjectId,
  appLoginKey: AppLoginKey,
): Promise<string> {
  const url = new URL(owner.reveal())
  url.username = appLogin(projectId).runLogin
  url.password = await appLoginPassword({ key: appLoginKey.reveal(), login: url.username })
  const client = new pg.Client({ connectionString: url.toString() })
  await client.connect()
  try {
    await client.query('begin')
    for (const text of PREVIOUS_VERSION) await client.query(text)
    return 'reads and writes'
  } catch (error) {
    return error instanceof pg.DatabaseError ? `refused ${error.code}: ${error.message}` : 'failed'
  } finally {
    await client.query('rollback').catch(() => undefined)
    await client.end()
  }
}

/** The app's logins the server still holds: none once its app is deleted (decision 0043). */
export async function appLoginsOf(owner: DatabaseUrl, projectId: ProjectId): Promise<string[]> {
  const { runLogin, migrateLogin } = appLogin(projectId)
  const client = new pg.Client({ connectionString: owner.reveal() })
  await client.connect()
  try {
    const roles = await client.query(
      'select rolname from pg_roles where rolname = any($1) order by 1',
      [[runLogin, migrateLogin]],
    )
    return roles.rows.map((row) => String(row.rolname))
  } finally {
    await client.end()
  }
}

/** The timeouts each of the app's logins carries, from its own settings (decision 0047). */
export async function appLoginTimeoutsOf(owner: DatabaseUrl, projectId: ProjectId) {
  const { runLogin, migrateLogin } = appLogin(projectId)
  const client = new pg.Client({ connectionString: owner.reveal() })
  await client.connect()
  try {
    const roles = await client.query(
      `select rolname, array(select s from unnest(rolconfig) s where s like '%timeout=%' order by s)
         as timeouts from pg_roles where rolname = any($1)`,
      [[runLogin, migrateLogin]],
    )
    function timeoutsOf(login: string) {
      return roles.rows.find((row) => row.rolname === login)?.timeouts
    }
    return { run: timeoutsOf(runLogin), migrate: timeoutsOf(migrateLogin) }
  } finally {
    await client.end()
  }
}

/**
 * Takes the app's schema and logins out of the company's database, as a restore to a minute before
 * its first send would: the Hub's repair must bring them back.
 */
export async function forgetApp(
  owner: DatabaseUrl,
  projectId: ProjectId,
  appLoginKey: AppLoginKey,
) {
  const postgres = createCompanyPostgres({ transport: pgTransport, appLoginKey })
  return (await postgres.dropApp(owner, projectId)).kind
}
