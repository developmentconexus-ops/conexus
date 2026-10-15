import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Readable } from 'node:stream'
import type { TestContext } from 'node:test'
import { Version } from '@conexus/hub-api'
import pg from 'pg'
import type { Config } from './config.ts'
import { PublicOrigin, readTestDatabase, SessionSecret } from './config.ts'
import type { Database } from './database.ts'
import { DatabaseUrl, openDatabase } from './database.ts'
import { migrate } from './migrate.ts'

// Roles belong to the whole server, so suites that touch them take turns on this lock.
const SERVER_ROLES_LOCK_KEY = 4_207_000_001
const RUNTIME_LOGIN = 'hub_runtime'
const silent = { info: () => undefined, error: () => undefined }

export const TEST_ORIGIN = PublicOrigin.parse('https://hub.example.test')

/** The configuration a test Hub serves with, its session secret fresh for each call. */
export function testConfig(databaseUrl: DatabaseUrl): Config {
  return {
    version: Version.parse('v0.1.0'),
    port: 1,
    logLevel: 'error',
    databaseUrl,
    publicOrigin: TEST_ORIGIN,
    sessionSecret: SessionSecret.parse(randomBytes(32).toString('base64url')),
  }
}

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

function keyFile(t: TestContext, name: string, value: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-key-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const path = join(dir, name)
  writeFileSync(path, value, { mode: 0o400 })
  return path
}

export function urlFile(t: TestContext, url: DatabaseUrl): string {
  return keyFile(t, 'database_url', url.reveal())
}

export function sessionSecretFile(t: TestContext): string {
  return keyFile(t, 'session_secret', randomBytes(32).toString('base64url'))
}

/** The environment a spawned Hub serves with, as Compose gives it; `spawnHub` adds the port. */
export function serveEnvironment(t: TestContext, url: DatabaseUrl, port?: number) {
  return {
    CONEXUS_VERSION: 'v0.1.0',
    ...(port === undefined ? {} : { HUB_PORT: String(port) }),
    LOG_LEVEL: 'info',
    HUB_DATABASE_URL_FILE: urlFile(t, url),
    HUB_PUBLIC_ORIGIN: TEST_ORIGIN,
    HUB_SESSION_SECRET_FILE: sessionSecretFile(t),
  }
}

const MAIN = join(import.meta.dirname, '..', 'main.ts')
// The test reporter refuses a raw line from an in-process test (scripts/test-reporter.ts); a spawned
// Hub's pipes reach no reporter, so this is the same rule for them (code C50, C54).
const CODE = /^[A-Z][A-Z0-9_]*$/

export type LogLine = Record<string, unknown>

function logLine(text: string): LogLine | undefined {
  if (text.match(/"level":/g)?.length !== 1) return undefined
  try {
    const parsed: unknown = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined
    const line: LogLine = Object.fromEntries(Object.entries(parsed))
    return CODE.test(String(line.msg)) ? line : undefined
  } catch {
    return undefined
  }
}

export type HubProcess = {
  lines: LogLine[]
  /** Resolves on the first line with this message; rejects when the Hub ends without one. */
  until(message: string): Promise<void>
  exited: Promise<number | null>
  kill(signal: NodeJS.Signals): void
}

/**
 * Runs the Hub's program with `env` and `args`, reading both of its pipes. When the test ends, the
 * program is killed if it still runs, and any line it printed outside the log format fails the test.
 */
export function startHub(
  t: Lifetime,
  env: Record<string, string>,
  args: string[] = [],
): HubProcess {
  const child = spawn(process.execPath, [MAIN, ...args], { env, stdio: ['ignore', 'pipe', 'pipe'] })
  const lines: LogLine[] = []
  const raw: string[] = []
  const waiting = new Map<string, PromiseWithResolvers<void>>()
  function waiterFor(message: string) {
    const waiter = waiting.get(message) ?? Promise.withResolvers<void>()
    waiting.set(message, waiter)
    return waiter
  }
  function read(stream: Readable) {
    let rest = ''
    stream.on('data', (chunk: Buffer) => {
      const texts = `${rest}${chunk}`.split('\n')
      rest = texts.pop() ?? ''
      for (const text of texts.filter(Boolean)) take(text)
    })
    stream.on('end', () => {
      if (rest !== '') take(rest)
    })
  }
  function take(text: string) {
    const line = logLine(text)
    if (line === undefined) raw.push(text)
    else {
      lines.push(line)
      waiterFor(String(line.msg)).resolve()
    }
  }
  read(child.stdout)
  read(child.stderr)
  const closed = once(child, 'close').then(([code]: unknown[]) => {
    for (const [message, waiter] of waiting) {
      waiter.reject(new Error(`the Hub ended without ${message}`))
    }
    return typeof code === 'number' ? code : null
  })
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    await closed
    assert.deepEqual(raw, [], 'the Hub printed lines outside the log format')
  })
  return {
    lines,
    until: (message) => waiterFor(message).promise,
    exited: closed,
    kill: (signal) => child.kill(signal),
  }
}

/** A Hub serving on a free port, listening; `stop` ends it as Compose does and expects exit 0. */
export async function spawnHub(t: Lifetime, env: Record<string, string>) {
  const port = await freePort()
  const hub = startHub(t, { ...env, HUB_PORT: String(port) })
  await hub.until('LISTENING')
  return {
    port,
    lines: hub.lines,
    stop: async () => {
      hub.kill('SIGTERM')
      assert.equal(await hub.exited, 0)
    },
  }
}
