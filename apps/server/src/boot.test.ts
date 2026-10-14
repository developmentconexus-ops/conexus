import assert from 'node:assert/strict'
import type { ChildProcess } from 'node:child_process'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { chmodSync } from 'node:fs'
import { createServer } from 'node:net'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { after, test } from 'node:test'
import {
  createTestDatabase,
  freePort,
  unreachableDatabaseUrl,
  urlFile,
} from './platform/test-database.ts'

const MAIN = join(import.meta.dirname, 'main.ts')
const children: ChildProcess[] = []
after(() => {
  for (const child of children) child.kill('SIGKILL')
})

type Line = Record<string, unknown>

function start(env: Record<string, string>, args: string[] = []) {
  const child = spawn(process.execPath, [MAIN, ...args], { env, stdio: ['ignore', 'pipe', 'pipe'] })
  children.push(child)
  const lines: Line[] = []
  const logged = new Map<string, PromiseWithResolvers<void>>()
  function waiterFor(message: string) {
    const waiter = logged.get(message) ?? Promise.withResolvers<void>()
    logged.set(message, waiter)
    return waiter
  }
  function until(message: string) {
    return waiterFor(message).promise
  }
  child.stdout.on('data', (chunk: Buffer) => {
    for (const text of String(chunk).split('\n').filter(Boolean)) {
      const line: Line = JSON.parse(text)
      lines.push(line)
      waiterFor(String(line.msg)).resolve()
    }
  })
  const exited = new Promise<number | null>((resolve) => child.on('exit', (code) => resolve(code)))
  return { child, lines, until, exited }
}

function messages(lines: Line[], message: string): Line[] {
  return lines.filter((line) => line.msg === message)
}

const GOOD_ENV = { CONEXUS_VERSION: 'v0.1.0', HUB_PORT: '8080', LOG_LEVEL: 'info' }
const WITH_FILE = { ...GOOD_ENV, HUB_DATABASE_URL_FILE: '/nowhere/hub_database_url' }

for (const name of Object.keys(WITH_FILE)) {
  test(`recusa subir sem ${name}`, async () => {
    const env = Object.fromEntries(Object.entries(WITH_FILE).filter(([key]) => key !== name))
    const { lines, exited } = start(env)
    assert.equal(await exited, 1)
    assert.equal(messages(lines, 'CONFIG_INVALID')[0]?.variables, name)
  })
}

const OUT_OF_FORMAT = [
  ['CONEXUS_VERSION', '0.1.0'],
  ['HUB_PORT', 'abc'],
  ['HUB_PORT', '70000'],
  ['LOG_LEVEL', 'loud'],
] as const
for (const [name, value] of OUT_OF_FORMAT) {
  test(`recusa subir com ${name}=${value} fora do formato`, async () => {
    const { lines, exited } = start({ ...WITH_FILE, [name]: value })
    assert.equal(await exited, 1)
    assert.equal(messages(lines, 'CONFIG_INVALID')[0]?.variables, name)
  })
}

async function serverEnv(t: TestContext, extra: Record<string, string> = {}) {
  const database = await createTestDatabase(t)
  const port = String(await freePort())
  const env = {
    ...GOOD_ENV,
    HUB_PORT: port,
    HUB_DATABASE_URL_FILE: urlFile(t, database.runtimeUrl),
  }
  return { database, env: { ...env, ...extra } }
}

test('atrasado: o banco sem uma migração que o programa traz recusa a subida', async (t) => {
  const { database, env } = await serverEnv(t)
  await database.asOwner('delete from drizzle.__drizzle_migrations')
  const { lines, exited } = start(env)
  assert.equal(await exited, 1)
  assert.equal(messages(lines, 'DATABASE_BEHIND')[0]?.missing, 1)
})

test('adiantado: o banco com migrações a mais deixa o programa subir', async (t) => {
  const { database, env } = await serverEnv(t)
  await database.asOwner(
    "insert into drizzle.__drizzle_migrations (hash, created_at, name) values ('x', 1, 'ahead')",
  )
  const { child, until, exited } = start(env)
  await until('LISTENING')
  child.kill('SIGTERM')
  assert.equal(await exited, 0)
})

test('banco fora na subida: sai com DATABASE_UNAVAILABLE', async (t) => {
  const { env } = await serverEnv(t)
  const dead = urlFile(t, await unreachableDatabaseUrl())
  const { lines, exited } = start({ ...env, HUB_DATABASE_URL_FILE: dead })
  assert.equal(await exited, 1)
  assert.equal(messages(lines, 'DATABASE_UNAVAILABLE').length, 1)
})

test('porta ocupada: registra o tipo da causa e o código, e sai com 1', async (t) => {
  const { env } = await serverEnv(t)
  const holder = createServer()
  t.after(() => holder.close())
  holder.listen(0, '0.0.0.0')
  await once(holder, 'listening')
  const address = holder.address()
  const port = typeof address === 'object' && address !== null ? address.port : 0
  const { lines, exited } = start({ ...env, HUB_PORT: String(port) })
  assert.equal(await exited, 1)
  const [failure] = messages(lines, 'INTERNAL_UNEXPECTED')
  assert.equal(failure?.causes, 'Error')
  assert.equal(failure?.code, 'EADDRINUSE')
  assert.equal(messages(lines, 'LISTENING').length, 0)
})

async function migrateEnv(t: TestContext) {
  const { database, env } = await serverEnv(t)
  return {
    database,
    env: { ...env, HUB_MIGRATION_DATABASE_URL_FILE: urlFile(t, database.ownerUrl) },
  }
}

test('migrate duas vezes: a segunda não aplica nada', async (t) => {
  const { database, env } = await migrateEnv(t)
  const count = 'select count(*)::int as applied from drizzle.__drizzle_migrations'
  const before = await database.asOwner(count)
  for (let run = 0; run < 2; run++) {
    const { lines, exited } = start(env, ['migrate'])
    assert.equal(await exited, 0)
    assert.equal(messages(lines, 'MIGRATED').length, 1)
  }
  assert.deepEqual(await database.asOwner(count), before)
})

test('migrate sem chave: nomeia a variável', async (t) => {
  const { env } = await migrateEnv(t)
  const { HUB_MIGRATION_DATABASE_URL_FILE: _, ...without } = env
  const { lines, exited } = start(without, ['migrate'])
  assert.equal(await exited, 1)
  assert.equal(messages(lines, 'CONFIG_INVALID')[0]?.variables, 'HUB_MIGRATION_DATABASE_URL_FILE')
})

test('migrate com a chave legível por outros: nomeia a variável', async (t) => {
  const { env } = await migrateEnv(t)
  chmodSync(env.HUB_MIGRATION_DATABASE_URL_FILE, 0o644)
  const { lines, exited } = start(env, ['migrate'])
  assert.equal(await exited, 1)
  assert.equal(messages(lines, 'CONFIG_INVALID')[0]?.variables, 'HUB_MIGRATION_DATABASE_URL_FILE')
})
