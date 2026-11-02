import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { hashPassword } from 'better-auth/crypto'
import { createHub, subjectsOf } from '../../main.ts'
import { testAppPorts } from '../../platform/test-app-ports.ts'
import type { TestDatabase } from '../../platform/test-database.ts'
import {
  createTestDatabase,
  silent,
  TEST_ORIGIN,
  TEST_PAGE,
  testConfig,
  testWebRoot,
  unreachableDatabase,
  WRITE_HEADERS,
} from '../../platform/test-database.ts'
import { testMail } from '../../platform/test-mail.ts'
import { testMastraPool } from '../../platform/test-mastra-database.ts'
import { createStatus } from '../status/public.ts'
import { createIdentity } from './public.ts'

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
  const sendMail = testMail(config)
  const identity = createIdentity({ database, config, log: silent, sendMail })
  const {
    projects,
    operations,
    apps,
    modelAccounts,
    conversations,
    assistant,
    automations,
    notifications,
    connectors,
  } = subjectsOf({
    mastraPool: testMastraPool(t, config),
    database,
    config,
    identity,
    sendMail,
    ...testAppPorts(config),
    log: silent,
  })
  const webRoot = testWebRoot(t)
  const app = await createHub(config, {
    status,
    identity,
    operations,
    projects,
    apps,
    modelAccounts,
    conversations,
    assistant,
    automations,
    notifications,
    connectors,
    webRoot,
  })
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

test('banco fora: a passagem ao app responde a página das telas com 503, nunca JSON', async (t) => {
  const config = testConfig((await createTestDatabase(t)).runtimeUrl)
  const cookie = await liveCookie(t, config)
  const app = await hubOn(t, await unreachableDatabase(t), config)
  const binding = 'b'.repeat(43)
  const open = await app.inject({
    method: 'GET',
    url: `/apps/open?host=pedidos--empresa-a&binding=${binding}`,
    headers: { cookie, 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'navigate' },
  })
  assert.equal(open.statusCode, 503)
  assert.match(String(open.headers['content-type']), /^text\/html/)
  assert.equal(open.body, TEST_PAGE)
})
