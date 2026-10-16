import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
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

const PASSWORD = 'senha-certa-1'
const ANA = { name: 'Ana Lima', email: 'ana@example.test', role: 'admin' }
const INVITEE = 'davi@example.test'
const WRITE = { origin: TEST_ORIGIN, 'content-type': 'application/json' }

/**
 * A fake of the mail provider (T15). DELIVER keeps each message and answers delivered; HOLD keeps
 * nothing and never answers, and `held` resolves when such a request has arrived.
 */
async function mailServer(t: TestContext) {
  const sent: { to: string; text: string }[] = []
  const state: { mode: 'DELIVER' | 'HOLD' } = { mode: 'DELIVER' }
  const held = Promise.withResolvers<void>()
  const server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      if (state.mode === 'HOLD') return held.resolve()
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      sent.push({ to: body.to, text: body.text })
      const result = { delivered: [body.to], permanent_bounces: [], queued: [] }
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ success: true, result }))
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  const url = `http://127.0.0.1:${address.port}/email/sending/send`
  return { url, sent, state, held: held.promise }
}

function id(): string {
  return randomBytes(16).toString('hex')
}

type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>

/** Ana, the installation administrator, signed in on the Hub at `base`: her session cookie. */
async function anaOn(test: TestDatabase, base: string): Promise<string> {
  const personId = id()
  await test.asOwner('insert into auth.user (id, name, email, role) values ($1, $2, $3, $4)', [
    personId,
    ANA.name,
    ANA.email,
    ANA.role,
  ])
  await test.asOwner(
    `insert into auth.account (id, account_id, provider_id, user_id, password, updated_at)
      values ($1, $2, 'credential', $2, $3, now())`,
    [id(), personId, await hashPassword(PASSWORD)],
  )
  const signedIn = await fetch(`${base}/api/sessions/current`, {
    method: 'PUT',
    headers: { ...WRITE, 'cf-connecting-ip': '198.51.100.9' },
    body: JSON.stringify({ email: ANA.email, password: PASSWORD }),
  })
  assert.equal(signedIn.status, 200)
  return signedIn.headers.getSetCookie()[0]?.split(';')[0] ?? ''
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
    const cookie = await anaOn(test, base)
    function post(path: string, body: unknown, key: string) {
      const headers = { ...WRITE, cookie, 'idempotency-key': key }
      return fetch(`${base}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
    }
    const created = await post('/api/companies', { name: 'Empresa Teste' }, randomUUID())
    const path = `/api/companies/${Object(await created.json()).company.id}/invitations`
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
      mail.sent.map((sent) => [sent.to, sent.text.endsWith(`/invitations/${invitation.id}\n`)]),
      [[INVITEE, true]],
    )
    assert.deepEqual(await test.asOwner(COMMITTED), [{ status: 'pending', mailed: true }])
  } finally {
    for (const hub of hubs) hub.kill('SIGKILL')
    await Promise.all(hubs.map((hub) => hub.exited))
  }
})
