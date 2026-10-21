import assert from 'node:assert/strict'
import { once } from 'node:events'
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import {
  createTestDatabase,
  freePort,
  serveEnvironment,
  unreachableDatabaseUrl,
  urlFile,
} from './platform/test-database.ts'
import { spawnHub, startHub } from './platform/test-hub-process.ts'

type Line = Record<string, unknown>

function shortSecretFile(t: TestContext): string {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-key-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  writeFileSync(join(dir, 'secret'), 'too-short', { mode: 0o400 })
  return join(dir, 'secret')
}

function messages(lines: Line[], message: string): Line[] {
  return lines.filter((line) => line.msg === message)
}

const GOOD_ENV = { CONEXUS_VERSION: 'v0.1.0', HUB_PORT: '8080', LOG_LEVEL: 'info' }
const WITH_FILE = {
  ...GOOD_ENV,
  HUB_DATABASE_URL_FILE: '/nowhere/hub_database_url',
  HUB_MASTRA_DATABASE_URL_FILE: '/nowhere/hub_mastra_database_url',
  HUB_EDGE_PORT: '8081',
  HUB_APPS_DOMAIN: 'apps.example.test',
  HUB_PUBLIC_ORIGIN: 'https://hub.example.test',
  HUB_SESSION_SECRET_FILE: '/nowhere/hub_session_secret',
  HUB_MAIL_API_URL: 'https://mail.example.test/email/sending/send',
  HUB_MAIL_FROM: 'convites@hub.example.test',
  HUB_MAIL_TOKEN_FILE: '/nowhere/hub_mail_token',
  HUB_NEON_API_URL: 'https://neon.example.test/api/v2',
  HUB_NEON_ORG_ID: 'org-test-0000',
  HUB_NEON_API_KEY_FILE: '/nowhere/hub_neon_api_key',
  HUB_APP_LOGIN_KEY_FILE: '/nowhere/hub_app_login_key',
  HUB_CLOUDFLARE_API_URL: 'https://cloudflare.example.test/client/v4',
  HUB_CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32),
  HUB_APPS_NAMESPACE: 'conexus-apps',
  HUB_CLOUDFLARE_APPS_TOKEN_FILE: '/nowhere/hub_cloudflare_apps_token',
  HUB_SEAL_KEYS_FILE: '/nowhere/hub_seal_keys',
  HUB_GIT_ROOT: '/var/lib/conexus/git',
  HUB_GIT_COPY_BUCKET: 'conexus-git-test',
  HUB_GIT_COPY_KEY_FILE: '/nowhere/hub_git_copy_key',
}

for (const name of Object.keys(WITH_FILE)) {
  test(`configuração: recusa subir sem ${name}`, async (t) => {
    const env = Object.fromEntries(Object.entries(WITH_FILE).filter(([key]) => key !== name))
    const { lines, exited } = startHub(t, env)
    assert.equal(await exited, 1)
    assert.equal(messages(lines, 'CONFIG_INVALID')[0]?.variables, name)
  })
}

const OUT_OF_FORMAT = [
  ['CONEXUS_VERSION', '0.1.0'],
  ['HUB_PORT', 'abc'],
  ['HUB_PORT', '70000'],
  ['LOG_LEVEL', 'loud'],
  ['HUB_EDGE_PORT', 'abc'],
  ['HUB_EDGE_PORT', '8080'],
  ['HUB_APPS_DOMAIN', 'Apps.Example.Test'],
  ['HUB_APPS_DOMAIN', 'localhost'],
  ['HUB_PUBLIC_ORIGIN', 'http://hub.example.test'],
  ['HUB_PUBLIC_ORIGIN', 'https://hub.example.test/'],
  ['HUB_MAIL_API_URL', 'ftp://mail.example.test/send'],
  ['HUB_MAIL_API_URL', 'http://mail.example.test/send'],
  ['HUB_MAIL_FROM', 'convites'],
  ['HUB_CLOUDFLARE_API_URL', 'http://cloudflare.example.test/client/v4'],
  ['HUB_CLOUDFLARE_ACCOUNT_ID', 'Conta'],
  ['HUB_APPS_NAMESPACE', 'conexus_apps'],
] as const
for (const [name, value] of OUT_OF_FORMAT) {
  test(`configuração: recusa subir com ${name}=${value} fora do formato`, async (t) => {
    const { lines, exited } = startHub(t, { ...WITH_FILE, [name]: value })
    assert.equal(await exited, 1)
    assert.equal(messages(lines, 'CONFIG_INVALID')[0]?.variables, name)
  })
}

async function serverEnv(t: TestContext, extra: Record<string, string> = {}) {
  const database = await createTestDatabase(t)
  const ports = { port: await freePort(), edgePort: await freePort() }
  const env = serveEnvironment(t, database.runtimeUrl, ports)
  return { database, env: { ...env, ...extra } }
}

test('configuração: sem o arquivo do segredo das sessões, nomeia a variável', async (t) => {
  const { env } = await serverEnv(t, { HUB_SESSION_SECRET_FILE: '/nowhere/hub_session_secret' })
  const { lines, exited } = startHub(t, env)
  assert.equal(await exited, 1)
  assert.equal(messages(lines, 'CONFIG_INVALID')[0]?.variables, 'HUB_SESSION_SECRET_FILE')
  assert.equal(messages(lines, 'LISTENING').length, 0)
})

test('configuração: com o segredo das sessões legível por outros, nomeia a variável', async (t) => {
  const { env } = await serverEnv(t)
  chmodSync(env.HUB_SESSION_SECRET_FILE, 0o644)
  const { lines, exited } = startHub(t, env)
  assert.equal(await exited, 1)
  assert.equal(messages(lines, 'CONFIG_INVALID')[0]?.variables, 'HUB_SESSION_SECRET_FILE')
})

test('configuração: com o segredo das sessões curto demais, nomeia a variável', async (t) => {
  const { env } = await serverEnv(t, { HUB_SESSION_SECRET_FILE: shortSecretFile(t) })
  const { lines, exited } = startHub(t, env)
  assert.equal(await exited, 1)
  assert.equal(messages(lines, 'CONFIG_INVALID')[0]?.variables, 'HUB_SESSION_SECRET_FILE')
})

test('configuração: sem o arquivo do token do correio, nomeia a variável', async (t) => {
  const { env } = await serverEnv(t, { HUB_MAIL_TOKEN_FILE: '/nowhere/hub_mail_token' })
  const { lines, exited } = startHub(t, env)
  assert.equal(await exited, 1)
  assert.equal(messages(lines, 'CONFIG_INVALID')[0]?.variables, 'HUB_MAIL_TOKEN_FILE')
  assert.equal(messages(lines, 'LISTENING').length, 0)
})

test('configuração: com o token do correio legível por outros, nomeia a variável', async (t) => {
  const { env } = await serverEnv(t)
  chmodSync(env.HUB_MAIL_TOKEN_FILE, 0o644)
  const { lines, exited } = startHub(t, env)
  assert.equal(await exited, 1)
  assert.equal(messages(lines, 'CONFIG_INVALID')[0]?.variables, 'HUB_MAIL_TOKEN_FILE')
})

test('atrasado: o banco sem uma migração que o programa traz recusa a subida', async (t) => {
  const { database, env } = await serverEnv(t)
  await database.asOwner(
    'delete from drizzle.__drizzle_migrations where id = (select max(id) from drizzle.__drizzle_migrations)',
  )
  const { lines, exited } = startHub(t, env)
  assert.equal(await exited, 1)
  assert.equal(messages(lines, 'DATABASE_BEHIND')[0]?.missing, 1)
})

test('mudada: uma migração aplicada que mudou nomeia a causa, não o atraso', async (t) => {
  const { database, env } = await serverEnv(t)
  await database.asOwner(
    "update drizzle.__drizzle_migrations set hash = 'changed' where name like '%hub_status_starts'",
  )
  const { lines, exited } = startHub(t, env)
  assert.equal(await exited, 1)
  assert.equal(messages(lines, 'DATABASE_BEHIND').length, 0)
  assert.match(
    String(messages(lines, 'DATABASE_MIGRATION_CHANGED')[0]?.changed),
    /hub_status_starts/,
  )
})

test('login: o Hub só sobe com o login hub_runtime, não com o dono do banco', async (t) => {
  const { database, env } = await serverEnv(t)
  const { lines, exited } = startHub(t, {
    ...env,
    HUB_DATABASE_URL_FILE: urlFile(t, database.ownerUrl),
  })
  assert.equal(await exited, 1)
  assert.equal(messages(lines, 'CONFIG_INVALID')[0]?.variables, 'HUB_DATABASE_URL_FILE')
  assert.equal(messages(lines, 'LISTENING').length, 0)
})

test('adiantado: o banco com migrações a mais deixa o programa subir', async (t) => {
  const { database, env } = await serverEnv(t)
  await database.asOwner(
    "insert into drizzle.__drizzle_migrations (hash, created_at, name) values ('x', 1, 'ahead')",
  )
  const hub = await spawnHub(t, env)
  await hub.stop()
})

test('banco fora na subida: sai com DATABASE_UNAVAILABLE', async (t) => {
  const { env } = await serverEnv(t)
  const dead = urlFile(t, await unreachableDatabaseUrl())
  const { lines, exited } = startHub(t, { ...env, HUB_DATABASE_URL_FILE: dead })
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
  const { lines, exited } = startHub(t, { ...env, HUB_PORT: String(port) })
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
    const { lines, exited } = startHub(t, env, ['migrate'])
    assert.equal(await exited, 0)
    assert.equal(messages(lines, 'MIGRATED').length, 1)
  }
  assert.deepEqual(await database.asOwner(count), before)
})

test('migrate sem chave: nomeia a variável', async (t) => {
  const { env } = await migrateEnv(t)
  const { HUB_MIGRATION_DATABASE_URL_FILE: _, ...without } = env
  const { lines, exited } = startHub(t, without, ['migrate'])
  assert.equal(await exited, 1)
  assert.equal(messages(lines, 'CONFIG_INVALID')[0]?.variables, 'HUB_MIGRATION_DATABASE_URL_FILE')
})

test('migrate com a chave legível por outros: nomeia a variável', async (t) => {
  const { env } = await migrateEnv(t)
  chmodSync(env.HUB_MIGRATION_DATABASE_URL_FILE, 0o644)
  const { lines, exited } = startHub(t, env, ['migrate'])
  assert.equal(await exited, 1)
  assert.equal(messages(lines, 'CONFIG_INVALID')[0]?.variables, 'HUB_MIGRATION_DATABASE_URL_FILE')
})
