import { randomUUID } from 'node:crypto'
import type { ProjectId } from '@conexus/hub-api'
import { appLogin } from '@conexus/hub-api'
import pg from 'pg'
import type { SqlAnswer, SqlStatement } from './company-postgres.ts'
import { answerOf, createCompanyPostgres } from './company-postgres.ts'
import type { AppLoginKey } from './config.ts'
import { readTestDatabase } from './config.ts'
import { DatabaseUrl } from './database.ts'
import type { Lifetime } from './test-database.ts'
import { withRoleLock } from './test-database.ts'

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
