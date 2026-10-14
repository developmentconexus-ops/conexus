import { randomUUID } from 'node:crypto'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import pg from 'pg'
import { readTestDatabase } from './config.ts'
import type { Database } from './database.ts'
import { DatabaseUrl, openDatabase } from './database.ts'
import { migrate } from './migrate.ts'

// Roles belong to the whole server, so suites that touch them take turns on this lock.
const SERVER_ROLES_LOCK_KEY = 4_207_000_001
const RUNTIME_LOGIN = 'hub_runtime'
const silent = { info: () => undefined, error: () => undefined }

type Lifetime = { after(cleanup: () => Promise<void> | void): void }

export type TestDatabase = {
  database: Database
  ownerUrl: DatabaseUrl
  runtimeUrl: DatabaseUrl
  container: string | undefined
  asOwner(text: string, values?: unknown[]): Promise<Record<string, unknown>[]>
}

function withDatabase(url: DatabaseUrl, name: string, login?: { user: string; password: string }) {
  const next = new URL(url.reveal())
  next.pathname = `/${name}`
  if (login !== undefined) {
    next.username = login.user
    next.password = login.password
  }
  return DatabaseUrl.parse(next.toString())
}

async function connected(url: DatabaseUrl): Promise<pg.Client> {
  const client = new pg.Client({ connectionString: url.reveal() })
  await client.connect()
  return client
}

export async function withRoleLock<T>(work: () => Promise<T>): Promise<T> {
  const client = await connected(readTestDatabase().ownerUrl)
  try {
    await client.query('begin')
    await client.query('select pg_advisory_xact_lock($1)', [SERVER_ROLES_LOCK_KEY])
    return await work()
  } finally {
    await client.query('commit')
    await client.end()
  }
}

export function runtimeUrlWithPassword(test: TestDatabase, password: string): DatabaseUrl {
  const next = new URL(test.runtimeUrl.reveal())
  next.password = password
  return DatabaseUrl.parse(next.toString())
}

export function databaseWithPassword(test: TestDatabase, password: string): Database {
  return openDatabase({ url: runtimeUrlWithPassword(test, password), log: silent })
}

export async function createTestDatabase(t: Lifetime): Promise<TestDatabase> {
  const { ownerUrl: serverUrl, runtimePassword, container } = readTestDatabase()
  const name = `conexus_test_${randomUUID().replaceAll('-', '')}`
  const ownerUrl = withDatabase(serverUrl, name)
  const runtimeUrl = withDatabase(serverUrl, name, {
    user: RUNTIME_LOGIN,
    password: runtimePassword,
  })
  const admin = await connected(serverUrl)
  await admin.query(`create database ${name}`)
  const database = openDatabase({ url: runtimeUrl, log: silent })
  t.after(async () => {
    try {
      await database.close()
      await admin.query(`drop database ${name} with (force)`)
    } finally {
      await admin.end()
    }
  })
  await withRoleLock(async () => {
    await migrate({ ownerUrl, runtimeUrl })
    // Dropping the database ends the Hub login's connections, which only a member may do.
    await admin.query('grant hub_runtime to current_user')
  })
  return {
    database,
    ownerUrl,
    runtimeUrl,
    container,
    asOwner: async (text, values) => {
      const client = await connected(ownerUrl)
      try {
        return (await client.query(text, values)).rows
      } finally {
        await client.end()
      }
    },
  }
}

export async function freePort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  await new Promise((resolve) => server.close(resolve))
  return typeof address === 'object' && address !== null ? address.port : 0
}

export async function unreachableDatabaseUrl(): Promise<DatabaseUrl> {
  return DatabaseUrl.parse(`postgres://nobody:nothing@127.0.0.1:${await freePort()}/none`)
}

export async function unreachableDatabase(t: Lifetime): Promise<Database> {
  const database = openDatabase({ url: await unreachableDatabaseUrl(), log: silent })
  t.after(() => database.close())
  return database
}

export function urlFile(t: TestContext, url: DatabaseUrl): string {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-key-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const path = join(dir, 'database_url')
  writeFileSync(path, url.reveal(), { mode: 0o400 })
  return path
}
