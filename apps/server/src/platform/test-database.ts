import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'
import { subscribe } from 'node:diagnostics_channel'
import { once } from 'node:events'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Readable } from 'node:stream'
import type { TestContext } from 'node:test'
import { after } from 'node:test'
import { Email, Version } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import pg from 'pg'
import { z } from 'zod'
import type { Config } from './config.ts'
import { MailApiUrl, MailToken, PublicOrigin, readTestDatabase, SessionSecret } from './config.ts'
import type { Database } from './database.ts'
import { DatabaseUrl, openDatabase } from './database.ts'
import { migrate } from './migrate.ts'

// Roles belong to the whole server, so suites that touch them take turns on this lock.
const SERVER_ROLES_LOCK_KEY = 4_207_000_001
const RUNTIME_LOGIN = 'hub_runtime'
const silent = { info: () => undefined, error: () => undefined }

// The codes any route may answer besides its operation's: the access check's and the two every
// route has. A route that answers another code its operation does not declare says less in the
// contract than it does (#32-9), so every Hub a test builds records it, and the test file fails.
const UNDECLARED_ALLOWED = new Set([
  'NOT_FOUND',
  'INTERNAL_UNEXPECTED',
  'REQUEST_ORIGIN_REFUSED',
  'REQUEST_MEDIA_TYPE_REFUSED',
  'REQUEST_MALFORMED',
  'REQUEST_TOO_LARGE',
  'SESSION_REQUIRED',
])
const Declared = z.looseObject({ failures: z.array(z.string()).default([]) })
const Answered = z.looseObject({ code: z.string() })
const undeclared: string[] = []

function isFastify(value: unknown): value is FastifyInstance {
  return typeof value === 'object' && value !== null && 'addHook' in value
}

subscribe('fastify.initialization', (message) => {
  const fastify = Reflect.get(Object(message), 'fastify')
  if (!isFastify(fastify)) return
  fastify.addHook('onSend', async (request, reply, payload) => {
    if (!String(reply.getHeader('content-type')).startsWith('application/problem+json')) return
    const { code } = Answered.parse(JSON.parse(String(payload)))
    const { failures } = Declared.parse(request.routeOptions.config)
    if (!UNDECLARED_ALLOWED.has(code) && !failures.includes(code)) {
      undeclared.push(`${request.method} ${request.routeOptions.url} ${code}`)
    }
  })
})
after(() =>
  assert.deepEqual(undeclared, [], 'a route answered a code its operation does not declare'),
)

/** The undeclared answers recorded so far, which the file's end no longer refuses. */
export function takeUndeclared(): string[] {
  return undeclared.splice(0)
}

export const TEST_ORIGIN = PublicOrigin.parse('https://hub.example.test')
// Nothing listens on the discard port, so a Hub that sends mail without a fake server fails loudly.
const NO_MAIL_SERVER = 'http://127.0.0.1:9/email/sending/send'
const TEST_MAIL_FROM = 'convites@hub.example.test'

/** The configuration a test Hub serves with, its secrets fresh for each call; mail goes to `mailApiUrl`. */
export function testConfig(databaseUrl: DatabaseUrl, mailApiUrl = NO_MAIL_SERVER): Config {
  return {
    version: Version.parse('v0.1.0'),
    port: 1,
    logLevel: 'error',
    databaseUrl,
    publicOrigin: TEST_ORIGIN,
    sessionSecret: SessionSecret.parse(randomBytes(32).toString('base64url')),
    mailApiUrl: MailApiUrl.parse(mailApiUrl),
    mailFrom: Email.parse(TEST_MAIL_FROM),
    mailToken: MailToken.parse(randomBytes(16).toString('hex')),
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
      // Without FORCE: DROP DATABASE ends an autovacuum worker in the database by itself, while
      // FORCE refuses with 42501 because the owner holds no privileges of that worker (#32-15).
      await admin.query(`drop database ${name}`)
    } finally {
      await admin.end()
    }
  })
  await withRoleLock(() => migrate({ ownerUrl, runtimeUrl }))
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

/** Resolves once the pool holds no connection, as when nobody uses Conexus (data D27). */
export async function whenIdle(database: Database): Promise<void> {
  const pool = database.libraryOrm({}).$client
  while (pool.totalCount > 0) await once(pool, 'remove')
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
    HUB_MAIL_API_URL: NO_MAIL_SERVER,
    HUB_MAIL_FROM: TEST_MAIL_FROM,
    HUB_MAIL_TOKEN_FILE: keyFile(t, 'hub_mail_token', randomBytes(16).toString('hex')),
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
