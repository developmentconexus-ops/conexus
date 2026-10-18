import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { Email } from '@conexus/hub-api'
import { appsOf, createHub, identityOf, operationsOf, projectsOf } from '../../main.ts'
import { testAppPorts } from '../../platform/test-app-ports.ts'
import {
  createTestDatabase,
  silent,
  testConfig,
  WRITE_HEADERS,
} from '../../platform/test-database.ts'
import { fakeNeon } from '../../platform/test-neon.ts'
import { createStatus } from '../status/public.ts'
import { codeOf, companyOn, INVITEE } from './test-hub.ts'

const LEAKED = '123456789'
const CLEAN = 'uma-senha-que-ninguem-vazou-7'
const TOKEN = /token=([A-Za-z0-9]+)/

/** A Hub whose first person has a link to create the password, and the fake of the leak service. */
async function linked(t: TestContext) {
  const test = await createTestDatabase(t)
  const config = testConfig(test.runtimeUrl)
  const status = createStatus({ version: config.version, database: test.database })
  const identity = identityOf({ database: test.database, config, log: silent })
  const projects = projectsOf({
    config,
    database: test.database,
    identity,
    neon: fakeNeon().neon,
    log: silent,
  })
  const operations = operationsOf(test.database, { identity, projects })
  const apps = appsOf({
    database: test.database,
    config,
    identity,
    projects,
    ...testAppPorts(config),
  })
  const app = await createHub(config, { status, identity, operations, projects, apps })
  t.after(() => app.close())
  const { link } = await identity.firstPerson({
    name: 'Ana Lima',
    email: Email.parse('ana@example.test'),
  })
  const token = String(link.match(TOKEN)?.[1])
  test.passwords.leaked.add(LEAKED)
  function set(password: string) {
    return app.inject({
      method: 'PUT',
      url: '/api/passwords',
      headers: WRITE_HEADERS,
      payload: JSON.stringify({ token, password }),
    })
  }
  function tokenWith(other: string) {
    return app.inject({
      method: 'PUT',
      url: '/api/passwords',
      headers: WRITE_HEADERS,
      payload: JSON.stringify({ token: other, password: CLEAN }),
    })
  }
  async function openTransactions() {
    const rows = await test.asOwner(
      `select count(*)::int as open from pg_stat_activity
        where datname = current_database() and state like 'idle in transaction%'`,
    )
    return rows[0]?.open
  }
  return { test, set, tokenWith, openTransactions }
}

test('vazada em PUT /api/passwords: 422 PASSWORD_COMPROMISED, o link continua e a senha limpa passa', async (t) => {
  const { test: db, set } = await linked(t)
  const refused = await set(LEAKED)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'PASSWORD_COMPROMISED'])
  assert.deepEqual(
    await db.asOwner(
      `select count(*)::int as accounts from auth.account where provider_id = 'credential'`,
    ),
    [{ accounts: 0 }],
  )
  assert.equal((await set(CLEAN)).statusCode, 204)
  // Only the first five characters of the hash leave the server.
  assert.deepEqual(
    db.passwords.asked.map((prefix) => /^[0-9A-F]{5}$/.test(prefix)),
    [true, true],
  )
})

test('vazada no convite: 422 PASSWORD_COMPROMISED, o convite fica na revisão e sem senha, e a limpa passa', async (t) => {
  const { hub, invite } = await companyOn(t)
  hub.test.passwords.leaked.add(LEAKED)
  const id = await invite()
  async function create(password: string) {
    return await hub.app.inject({
      method: 'PUT',
      url: `/api/invitations/${id}/password`,
      headers: WRITE_HEADERS,
      payload: { name: 'Davi Reis', password, revision: 0 },
    })
  }
  const refused = await create(LEAKED)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'PASSWORD_COMPROMISED'])
  assert.deepEqual(
    await hub.test.asOwner(`select status, revision from auth.invitation where id = $1`, [id]),
    [{ status: 'pending', revision: 0 }],
  )
  assert.deepEqual(
    await hub.test.asOwner(`select 1 from auth.user where email = $1`, [INVITEE]),
    [],
  )
  assert.equal((await create(CLEAN)).statusCode, 204)
})

test('fora: o serviço com erro dá 503 PASSWORD_CHECK_UNAVAILABLE e o link continua', async (t) => {
  const { test: db, set } = await linked(t)
  db.passwords.mode = 'DOWN'
  const refused = await set(CLEAN)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [503, 'PASSWORD_CHECK_UNAVAILABLE'])
  db.passwords.mode = 'CLEAN'
  assert.equal((await set(CLEAN)).statusCode, 204)
})

test('fora: sem resposta em 3 s dá 503 e, enquanto espera, nenhuma transação está aberta', async (t) => {
  const { test: db, set, openTransactions } = await linked(t)
  db.passwords.mode = 'HANG'
  const started = Date.now()
  const pending = set(CLEAN)
  while (db.passwords.asked.length === 0) await new Promise((resolve) => setTimeout(resolve, 20))
  assert.equal(await openTransactions(), 0)
  const refused = await pending
  assert.deepEqual([refused.statusCode, codeOf(refused)], [503, 'PASSWORD_CHECK_UNAVAILABLE'])
  const waited = Date.now() - started
  assert.ok(waited >= 2900 && waited < 4500, `the deadline is 3 seconds, not ${waited} ms`)
  db.passwords.mode = 'CLEAN'
  assert.equal((await set(CLEAN)).statusCode, 204)
})

test('link primeiro: um token inventado ou vencido dá PASSWORD_LINK_INVALID sem perguntar ao serviço de senhas vazadas', async (t) => {
  const { test: db, set, tokenWith } = await linked(t)
  const made = await tokenWith('inventado')
  assert.deepEqual([made.statusCode, codeOf(made)], [422, 'PASSWORD_LINK_INVALID'])
  await db.asOwner(`update auth.verification set expires_at = now() - interval '1 minute'`)
  const expired = await set(CLEAN)
  assert.deepEqual([expired.statusCode, codeOf(expired)], [422, 'PASSWORD_LINK_INVALID'])
  assert.deepEqual(db.passwords.asked, [])
})
