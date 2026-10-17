import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { hashPassword } from 'better-auth/crypto'
import type { HubProcess } from '../../platform/test-database.ts'
import {
  createTestDatabase,
  freePort,
  serveEnvironment,
  startHub,
  TEST_ORIGIN,
} from '../../platform/test-database.ts'
import { ANA_OWNER, INVITEE, id, mailServer, PASSWORD, plantCompany } from './test-hub.ts'

const WRITE = { origin: TEST_ORIGIN, 'content-type': 'application/json' }

type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>

/** Ana, owner of Empresa Teste, signed in on the Hub at `base`: her session cookie and company. */
async function ownerOn(test: TestDatabase, base: string) {
  const personId = id()
  await test.asOwner('insert into auth.user (id, name, email) values ($1, $2, $3)', [
    personId,
    ANA_OWNER.name,
    ANA_OWNER.email,
  ])
  await test.asOwner(
    `insert into auth.account (id, account_id, provider_id, user_id, password, updated_at)
      values ($1, $2, 'credential', $2, $3, now())`,
    [id(), personId, await hashPassword(PASSWORD)],
  )
  const signedIn = await fetch(`${base}/api/sessions/current`, {
    method: 'PUT',
    headers: { ...WRITE, 'cf-connecting-ip': '198.51.100.9' },
    body: JSON.stringify({ email: ANA_OWNER.email, password: PASSWORD }),
  })
  assert.equal(signedIn.status, 200)
  const cookie = signedIn.headers.getSetCookie()[0]?.split(';')[0] ?? ''
  return { cookie, companyId: await plantCompany(test, personId) }
}

const COMMITTED = 'select status, mailed_at is not null as mailed from auth.invitation'

test('de novo com a mesma chave: o Hub parou entre o convite e o e-mail, e chega um e-mail só', async (t) => {
  const test = await createTestDatabase(t)
  const mail = await mailServer(t)
  const env = { ...serveEnvironment(t, test.runtimeUrl), HUB_MAIL_API_URL: mail.url }
  const port = await freePort()
  const base = `http://127.0.0.1:${port}`
  const hubs: HubProcess[] = []
  async function listening() {
    const hub = startHub(t, { ...env, HUB_PORT: String(port) })
    hubs.push(hub)
    await hub.until('LISTENING')
    return hub
  }
  // Every Hub ends here, pass or fail: the test database is dropped before startHub's cleanup.
  try {
    const first = await listening()
    const { cookie, companyId } = await ownerOn(test, base)
    function post(path: string, body: unknown, key: string) {
      const headers = { ...WRITE, cookie, 'idempotency-key': key }
      return fetch(`${base}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
    }
    const path = `/api/companies/${companyId}/invitations`
    const key = randomUUID()
    function invite() {
      return post(path, { email: INVITEE, role: 'member' }, key)
    }
    mail.state.mode = 'HOLD'
    const lost = invite().catch(() => 'LOST')
    await mail.held
    first.kill('SIGKILL')
    await first.exited
    assert.equal(await lost, 'LOST')
    assert.deepEqual(await test.asOwner(COMMITTED), [{ status: 'pending', mailed: false }])

    mail.state.mode = 'DELIVER'
    await listening()
    const replayed = await invite()
    assert.equal(replayed.status, 201)
    const { invitation } = Object(await replayed.json())
    assert.equal((await invite()).status, 201)
    assert.deepEqual(
      mail.sent.map((sent) => [sent.to, sent.text.includes(`/invitations/${invitation.id}`)]),
      [[INVITEE, true]],
    )
    assert.deepEqual(await test.asOwner(COMMITTED), [{ status: 'pending', mailed: true }])
  } finally {
    for (const hub of hubs) hub.kill('SIGKILL')
    await Promise.all(hubs.map((hub) => hub.exited))
  }
})
