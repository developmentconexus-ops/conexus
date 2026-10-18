import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { subscribe } from 'node:diagnostics_channel'
import { once } from 'node:events'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { after } from 'node:test'
import { setTimeout } from 'node:timers/promises'
import { Email, PROBLEM_MEDIA_TYPE, Version } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import pg from 'pg'
import { z } from 'zod'
import type { Config } from './config.ts'
import {
  AppsDomain,
  MailApiUrl,
  MailToken,
  PublicOrigin,
  readTestDatabase,
  SessionSecret,
} from './config.ts'
import type { Database } from './database.ts'
import { DatabaseUrl, openDatabase, RUNTIME_LOGIN } from './database.ts'
import { migrate } from './migrate.ts'
import {
  NO_CLOUDFLARE_SERVER,
  TEST_ACCOUNT,
  TEST_NAMESPACE,
  testAppsConfig,
} from './test-cloudflare.ts'
import { NO_NEON_SERVER, TEST_NEON_ORG, testNeon } from './test-neon.ts'
import type { PasswordService } from './test-password-service.ts'
import { plantPasswordService } from './test-password-service.ts'

// Roles belong to the whole server, so suites that touch them take turns on this lock.
const SERVER_ROLES_LOCK_KEY = 4_207_000_001
export const silent = { info: () => undefined, error: () => undefined }

// The codes a route may answer besides its operation's and the platform's (`failuresOf`): the
// unmatched address's NOT_FOUND, which no route registers, and the access check's SESSION_REQUIRED.
// A route that answers another code its operation does not declare says less in the contract than
// it does (#32-9), so every Hub a test builds records it, and the test file fails.
const UNDECLARED_ALLOWED = new Set(['NOT_FOUND', 'SESSION_REQUIRED'])
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
    if (!String(reply.getHeader('content-type')).startsWith(PROBLEM_MEDIA_TYPE)) return
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
export const TEST_APPS_DOMAIN = AppsDomain.parse('apps.example.test')
export const CLIENT = '203.0.113.7'
export const WRITE_HEADERS = {
  origin: TEST_ORIGIN,
  'content-type': 'application/json',
  'cf-connecting-ip': CLIENT,
}
// Nothing listens on the discard port, so a Hub that sends mail without a fake server fails loudly.
const NO_MAIL_SERVER = 'http://127.0.0.1:9/email/sending/send'
const TEST_MAIL_FROM = 'convites@hub.example.test'

/** The configuration a test Hub serves with, its secrets fresh for each call; mail goes to `mailApiUrl`. */
export function testConfig(
  databaseUrl: DatabaseUrl,
  mailApiUrl = NO_MAIL_SERVER,
  neonApiUrl = NO_NEON_SERVER,
  cloudflareApiUrl = NO_CLOUDFLARE_SERVER,
): Config {
  return {
    version: Version.parse('v0.1.0'),
    port: 1,
    edgePort: 2,
    appsDomain: TEST_APPS_DOMAIN,
    logLevel: 'error',
    databaseUrl,
    publicOrigin: TEST_ORIGIN,
    sessionSecret: SessionSecret.parse(randomBytes(32).toString('base64url')),
    mailApiUrl: MailApiUrl.parse(mailApiUrl),
    mailFrom: Email.parse(TEST_MAIL_FROM),
    mailToken: MailToken.parse(randomBytes(16).toString('hex')),
    ...testNeon(neonApiUrl),
    ...testAppsConfig(cloudflareApiUrl),
  }
}

export type Lifetime = { after(cleanup: () => Promise<void> | void): void }

export type TestDatabase = {
  passwords: PasswordService
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

/** A fresh database; `locale: 'C'` makes one whose `LC_CTYPE` knows no case outside ASCII. */
export async function createTestDatabase(t: Lifetime, locale?: 'C'): Promise<TestDatabase> {
  const { ownerUrl: serverUrl, runtimePassword, container } = readTestDatabase()
  const name = `conexus_test_${randomUUID().replaceAll('-', '')}`
  const ownerUrl = withDatabase(serverUrl, name)
  const runtimeUrl = withDatabase(serverUrl, name, {
    user: RUNTIME_LOGIN,
    password: runtimePassword,
  })
  const admin = await connected(serverUrl)
  const localeClause =
    locale && `template template0 encoding 'UTF8' lc_collate '${locale}' lc_ctype '${locale}'`
  await admin.query(`create database ${name} ${localeClause ?? ''}`)
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
    passwords: plantPasswordService(t),
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

/**
 * Runs `text` as the owner in a transaction that stays open while `work` runs, so the locks it takes
 * are held until `work` calls `release`, or ends.
 */
export async function withOwnerLock<T>(
  test: TestDatabase,
  text: string,
  values: unknown[],
  work: (release: () => Promise<void>) => Promise<T>,
): Promise<T> {
  const client = await connected(test.ownerUrl)
  try {
    await client.query('begin')
    await client.query(text, values)
    return await work(async () => void (await client.query('commit')))
  } finally {
    await client.end()
  }
}

/**
 * Resolves once `count` sessions of this database wait on a lock, the barrier of a race test under
 * `withOwnerLock` (code C65); or once `request` has answered, so a request that never queues fails
 * on its own answer instead of here.
 */
export async function queued(test: TestDatabase, count: number, request?: Promise<unknown>) {
  let answered = false
  void request?.then(() => {
    answered = true
  })
  const waiting = `select count(distinct l.pid)::int as waiting from pg_locks l
    join pg_stat_activity a on a.pid = l.pid
    where not l.granted and a.datname = current_database()`
  const deadline = Date.now() + 5_000
  while (!answered && Object((await test.asOwner(waiting))[0]).waiting < count) {
    assert.ok(Date.now() < deadline, `${count} requests never queued on the lock`)
    await setTimeout(20)
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

export async function unreachableDatabaseUrl(login = 'nobody'): Promise<DatabaseUrl> {
  return DatabaseUrl.parse(`postgres://${login}:nothing@127.0.0.1:${await freePort()}/none`)
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

/** The environment a spawned Hub serves with, as Compose gives it; `spawnHub` adds the ports. */
export function serveEnvironment(
  t: TestContext,
  url: DatabaseUrl,
  ports?: { port: number; edgePort: number },
) {
  return {
    CONEXUS_VERSION: 'v0.1.0',
    ...(ports === undefined
      ? {}
      : { HUB_PORT: String(ports.port), HUB_EDGE_PORT: String(ports.edgePort) }),
    LOG_LEVEL: 'info',
    HUB_DATABASE_URL_FILE: urlFile(t, url),
    HUB_PUBLIC_ORIGIN: TEST_ORIGIN,
    HUB_APPS_DOMAIN: TEST_APPS_DOMAIN,
    HUB_SESSION_SECRET_FILE: sessionSecretFile(t),
    HUB_MAIL_API_URL: NO_MAIL_SERVER,
    HUB_MAIL_FROM: TEST_MAIL_FROM,
    HUB_MAIL_TOKEN_FILE: keyFile(t, 'hub_mail_token', randomBytes(16).toString('hex')),
    HUB_NEON_API_URL: NO_NEON_SERVER,
    HUB_NEON_ORG_ID: TEST_NEON_ORG,
    HUB_NEON_API_KEY_FILE: keyFile(t, 'hub_neon_api_key', randomBytes(16).toString('hex')),
    HUB_APP_LOGIN_KEY_FILE: keyFile(t, 'hub_app_login_key', randomBytes(32).toString('hex')),
    HUB_CLOUDFLARE_API_URL: NO_CLOUDFLARE_SERVER,
    HUB_CLOUDFLARE_ACCOUNT_ID: TEST_ACCOUNT,
    HUB_APPS_NAMESPACE: TEST_NAMESPACE,
    HUB_CLOUDFLARE_APPS_TOKEN_FILE: keyFile(t, 'hub_apps_token', randomBytes(16).toString('hex')),
  }
}
