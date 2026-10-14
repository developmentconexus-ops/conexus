import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { join } from 'node:path'
import { test } from 'node:test'
import { Version } from '@conexus/hub-api'
import { createHub } from '../../main.ts'
import {
  createTestDatabase,
  freePort,
  unreachableDatabase,
  unreachableDatabaseUrl,
  urlFile,
} from '../../platform/test-database.ts'
import { createStatus } from './public.ts'

const VERSION = Version.parse('v0.1.0')
const MAIN = join(import.meta.dirname, '..', '..', 'main.ts')

function config(databaseUrl: Parameters<typeof createHub>[0]['databaseUrl']) {
  return { version: VERSION, port: 1, logLevel: 'error', databaseUrl } as const
}

async function hubOn(t: Parameters<typeof createTestDatabase>[0]) {
  const test = await createTestDatabase(t)
  const status = createStatus({ version: VERSION, database: test.database })
  const app = await createHub(config(test.runtimeUrl), { status })
  t.after(() => app.close())
  return { app, status, test }
}

const STATUS = { method: 'GET', url: '/api/status' } as const
const NONE = { state: 'NONE' }

test('sem início gravado, os dois inícios são NONE', async (t) => {
  const { app } = await hubOn(t)
  const response = await app.inject(STATUS)
  assert.equal(response.statusCode, 200)
  assert.equal(
    response.body,
    '{"version":"v0.1.0","lastStart":{"state":"NONE"},"previousStart":{"state":"NONE"}}',
  )
})

test('um início gravado, o anterior é NONE', async (t) => {
  const { app, test } = await hubOn(t)
  await test.asOwner(
    "insert into hub.starts (version, started_at) values ('v0.1.0', '2026-10-14T17:02:00Z')",
  )
  const response = await app.inject(STATUS)
  assert.deepEqual(response.json(), {
    version: 'v0.1.0',
    lastStart: { state: 'RECORDED', version: 'v0.1.0', startedAt: '2026-10-14T17:02:00.000Z' },
    previousStart: NONE,
  })
})

test('os dois últimos inícios, o mais novo primeiro', async (t) => {
  const { app, test } = await hubOn(t)
  await test.asOwner(`insert into hub.starts (version, started_at) values
    ('v0.1.0', '2026-10-14T16:00:00Z'), ('v0.1.1', '2026-10-14T17:02:00Z'), ('v0.2.0', '2026-10-14T18:10:00Z')`)
  const response = await app.inject(STATUS)
  assert.equal(
    response.body,
    JSON.stringify({
      version: 'v0.1.0',
      lastStart: { state: 'RECORDED', version: 'v0.2.0', startedAt: '2026-10-14T18:10:00.000Z' },
      previousStart: {
        state: 'RECORDED',
        version: 'v0.1.1',
        startedAt: '2026-10-14T17:02:00.000Z',
      },
    }),
  )
})

test('recordStart grava a versão que roda, e o último início passa a ser ele', async (t) => {
  const { app, status } = await hubOn(t)
  await status.recordStart()
  const body = (await app.inject(STATUS)).json()
  assert.equal(body.lastStart.state, 'RECORDED')
  assert.equal(body.lastStart.version, 'v0.1.0')
  assert.match(body.lastStart.startedAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/)
  assert.deepEqual(body.previousStart, NONE)
  await status.recordStart()
  assert.equal((await app.inject(STATUS)).json().previousStart.state, 'RECORDED')
})

test('com o banco fora, /api/status responde 503 e /api/health continua 200', async (t) => {
  const status = createStatus({ version: VERSION, database: await unreachableDatabase(t) })
  const app = await createHub(config(await unreachableDatabaseUrl()), { status })
  t.after(() => app.close())
  const response = await app.inject(STATUS)
  assert.equal(response.statusCode, 503)
  assert.match(String(response.headers['content-type']), /^application\/problem\+json/)
  const { traceId, ...problem } = response.json()
  assert.match(traceId, /^[0-9a-f-]{36}$/)
  assert.deepEqual(problem, {
    type: 'urn:conexus:problem:DATABASE_UNAVAILABLE',
    title: 'O banco do Conexus não respondeu.',
    status: 503,
    code: 'DATABASE_UNAVAILABLE',
  })
  const health = await app.inject({ method: 'GET', url: '/api/health' })
  assert.equal(health.statusCode, 200)
})

test('uma linha fora do contrato é recusada na leitura, sem o valor no log', async (t) => {
  const { app, test } = await hubOn(t)
  await test.asOwner('alter table hub.starts drop constraint starts_version_format')
  await test.asOwner("insert into hub.starts (version) values ('PLANTED-not-a-version')")
  const response = await app.inject(STATUS)
  assert.equal(response.statusCode, 500)
  assert.equal(response.json().code, 'INTERNAL_UNEXPECTED')
  assert.doesNotMatch(response.body, /PLANTED/)
  const port = await freePort()
  const child = spawn(process.execPath, [MAIN], {
    env: {
      CONEXUS_VERSION: 'v0.1.0',
      HUB_PORT: String(port),
      LOG_LEVEL: 'info',
      HUB_DATABASE_URL_FILE: urlFile(t, test.runtimeUrl),
    },
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  t.after(() => child.kill('SIGKILL'))
  let output = ''
  const listening = Promise.withResolvers<void>()
  child.stdout.on('data', (chunk) => {
    output += chunk
    if (output.includes('LISTENING')) listening.resolve()
  })
  const exited = once(child, 'exit')
  await listening.promise
  const live = await fetch(`http://127.0.0.1:${port}/api/status`)
  assert.equal(live.status, 500)
  child.kill('SIGTERM')
  await exited
  assert.match(output, /INTERNAL_UNEXPECTED/)
  assert.doesNotMatch(output, /PLANTED/)
})

test('o objeto é congelado', async (t) => {
  const { status } = await hubOn(t)
  assert.ok(Object.isFrozen(status))
})
