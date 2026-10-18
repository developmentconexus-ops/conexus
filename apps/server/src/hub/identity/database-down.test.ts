import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { hashPassword } from 'better-auth/crypto'
import { appsOf, createHub, identityOf, operationsOf, projectsOf } from '../../main.ts'
import { testAppPorts } from '../../platform/test-app-ports.ts'
import type { TestDatabase } from '../../platform/test-database.ts'
import {
  createTestDatabase,
  silent,
  TEST_ORIGIN,
  testConfig,
  unreachableDatabase,
  WRITE_HEADERS,
} from '../../platform/test-database.ts'
import { fakeNeon } from '../../platform/test-neon.ts'
import { createStatus } from '../status/public.ts'

type Config = ReturnType<typeof testConfig>
const ANA = { id: 'person-ana', name: 'Ana Lima', email: 'ana@example.test' }
const PASSWORD = 'senha-certa-1'
const SESSIONS = '/api/sessions/current'
const UNAVAILABLE = {
  type: 'urn:conexus:problem:DATABASE_UNAVAILABLE',
  title: 'O banco do Conexus não respondeu.',
  status: 503,
  code: 'DATABASE_UNAVAILABLE',
}

async function hubOn(t: TestContext, database: TestDatabase['database'], config: Config) {
  const status = createStatus({ version: config.version, database })
  const identity = identityOf({ database, config, log: silent })
  const neon = fakeNeon().neon
  const projects = projectsOf({ config, database, identity, neon, log: silent })
  const operations = operationsOf(database, { identity, projects })
  const apps = appsOf({ database, config, identity, projects, ...testAppPorts(config) })
  const app = await createHub(config, { status, identity, operations, projects, apps })
  t.after(() => app.close())
  return app
}

/** A cookie signed by a Hub whose database answers, for the Hub whose database does not. */
async function liveCookie(t: TestContext, config: Config): Promise<string> {
  const test = await createTestDatabase(t)
  const live = await hubOn(t, test.database, config)
  await test.asOwner(`insert into auth.user (id, name, email) values ($1, $2, $3)`, [
    ANA.id,
    ANA.name,
    ANA.email,
  ])
  await test.asOwner(
    `insert into auth.account (id, account_id, provider_id, user_id, password, updated_at)
      values ('account-ana', $1, 'credential', $1, $2, now())`,
    [ANA.id, await hashPassword(PASSWORD)],
  )
  const signed = await live.inject({
    method: 'PUT',
    url: SESSIONS,
    headers: WRITE_HEADERS,
    payload: JSON.stringify({ email: ANA.email, password: PASSWORD }),
  })
  assert.equal(signed.statusCode, 200)
  return String(signed.headers['set-cookie']).split(';')[0] ?? ''
}

function problem(response: { json(): unknown }) {
  const { traceId, ...rest } = Object(response.json())
  assert.match(String(traceId), /^[0-9a-f-]{36}$/)
  return rest
}

test('banco fora: entrar, ler a sessão e sair respondem 503 DATABASE_UNAVAILABLE', async (t) => {
  // One configuration, so one session secret: only the database differs between the two Hubs.
  const config = testConfig((await createTestDatabase(t)).runtimeUrl)
  const cookie = await liveCookie(t, config)
  const app = await hubOn(t, await unreachableDatabase(t), config)
  const answers = [
    await app.inject({
      method: 'PUT',
      url: SESSIONS,
      headers: WRITE_HEADERS,
      payload: JSON.stringify({ email: ANA.email, password: PASSWORD }),
    }),
    await app.inject({ method: 'GET', url: SESSIONS, headers: { cookie } }),
    await app.inject({ method: 'DELETE', url: SESSIONS, headers: { origin: TEST_ORIGIN, cookie } }),
  ]
  for (const [index, response] of answers.entries()) {
    assert.equal(response.statusCode, 503, `pedido ${index}`)
    assert.deepEqual(problem(response), UNAVAILABLE, `pedido ${index}`)
  }
})
