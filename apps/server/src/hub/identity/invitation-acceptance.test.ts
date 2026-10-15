import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setTimeout } from 'node:timers/promises'
import { hashPassword } from 'better-auth/crypto'
import { createHub, identityOf } from '../../main.ts'
import {
  createTestDatabase,
  TEST_ORIGIN,
  testConfig,
  withOwnerLock,
} from '../../platform/test-database.ts'
import { createStatus } from '../status/public.ts'

const silent = { info: () => undefined, error: () => undefined }
const PASSWORD = 'senha-certa-1'
const ANA = { name: 'Ana Lima', email: 'ana@example.test', role: 'admin' }
const INVITEE = 'davi@example.test'

type Mail = { to: string; subject: string; text: string }
type Mode = 'DELIVER' | 'BOUNCE' | 'FAIL'

/** A fake of the mail provider (T15): it keeps each message and answers as `mode` says. */
async function mailServer(t: TestContext) {
  const sent: Mail[] = []
  const state: { mode: Mode } = { mode: 'DELIVER' }
  const server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      if (state.mode === 'FAIL') return response.writeHead(500).end()
      sent.push({ to: body.to, subject: body.subject, text: body.text })
      const bounced = state.mode === 'BOUNCE' ? [body.to] : []
      const delivered = state.mode === 'DELIVER' ? [body.to] : []
      const result = { delivered, permanent_bounces: bounced, queued: [] }
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
  return { url: `http://127.0.0.1:${address.port}/email/sending/send`, sent, state }
}

async function hubOn(t: TestContext) {
  const test = await createTestDatabase(t)
  const mail = await mailServer(t)
  const config = testConfig(test.runtimeUrl, mail.url)
  const status = createStatus({ version: config.version, database: test.database })
  const identity = identityOf({ database: test.database, config, log: silent })
  const app = await createHub(config, { status, identity })
  t.after(() => app.close())
  return { app, test, mail }
}

type Hub = Awaited<ReturnType<typeof hubOn>>

function id(): string {
  return randomBytes(16).toString('hex')
}

async function personOn(hub: Hub, who: { name: string; email: string; role?: string }) {
  const personId = id()
  await hub.test.asOwner('insert into auth.user (id, name, email, role) values ($1, $2, $3, $4)', [
    personId,
    who.name,
    who.email,
    who.role ?? 'user',
  ])
  await hub.test.asOwner(
    `insert into auth.account (id, account_id, provider_id, user_id, password, updated_at)
      values ($1, $2, 'credential', $2, $3, now())`,
    [id(), personId, await hashPassword(PASSWORD)],
  )
  const signedIn = await hub.app.inject({
    method: 'PUT',
    url: '/api/sessions/current',
    headers: {
      origin: TEST_ORIGIN,
      'content-type': 'application/json',
      'cf-connecting-ip': `198.51.100.${Math.floor(Math.random() * 250) + 1}`,
    },
    payload: JSON.stringify({ email: who.email, password: PASSWORD }),
  })
  assert.equal(signedIn.statusCode, 200)
  return { id: personId, cookie: String(signedIn.headers['set-cookie']).split(';')[0] ?? '' }
}

type Person = Awaited<ReturnType<typeof personOn>>

function post(hub: Hub, person: Person, url: string, body: unknown, key: string = randomUUID()) {
  return hub.app.inject({
    method: 'POST',
    url,
    headers: {
      origin: TEST_ORIGIN,
      'content-type': 'application/json',
      'idempotency-key': key,
      cookie: person.cookie,
    },
    payload: JSON.stringify(body),
  })
}

async function companyOn(t: TestContext) {
  const hub = await hubOn(t)
  const ana = await personOn(hub, ANA)
  const created = await post(hub, ana, '/api/companies', { name: 'Empresa Teste' })
  const companyId = String(Object(created.json()).company.id)
  async function invite(email = INVITEE, key?: string): Promise<string> {
    const body = { email, role: 'admin' }
    const response = await post(hub, ana, `/api/companies/${companyId}/invitations`, body, key)
    assert.equal(response.statusCode, 201)
    return String(Object(response.json()).invitation.id)
  }
  return { hub, ana, companyId, invite }
}

function codeOf(response: { json(): unknown }): unknown {
  return Object(response.json()).code
}

const DAVI = { name: 'Davi Costa', email: INVITEE }

function put(hub: Hub, person: Person | undefined, url: string) {
  return hub.app.inject({
    method: 'PUT',
    url,
    headers: { origin: TEST_ORIGIN, ...(person ? { cookie: person.cookie } : {}) },
  })
}

function read(hub: Hub, person: Person | undefined, invitationId: string) {
  return hub.app.inject({
    method: 'GET',
    url: `/api/invitations/${invitationId}`,
    headers: person ? { cookie: person.cookie } : {},
  })
}

function accept(hub: Hub, person: Person, invitationId: string) {
  return put(hub, person, `/api/invitations/${invitationId}/acceptance`)
}

async function members(hub: Hub, personId: string) {
  return hub.test.asOwner('select role from auth.member where user_id = $1', [personId])
}

async function statusOf(hub: Hub, invitationId: string) {
  return hub.test.asOwner('select status from auth.invitation where id = $1', [invitationId])
}

test('ler: a convidada, 200 com o estado; outra pessoa, 404; sem sessão, 401', async (t) => {
  const { hub, companyId, invite } = await companyOn(t)
  const davi = await personOn(hub, DAVI)
  const outsider = await personOn(hub, { name: 'Edu Melo', email: 'edu@example.test' })
  const invitationId = await invite()
  const received = await read(hub, davi, invitationId)
  assert.equal(received.statusCode, 200)
  assert.deepEqual(received.json(), {
    invitation: {
      id: invitationId,
      company: { id: companyId, name: 'Empresa Teste' },
      role: 'admin',
      inviterName: 'Ana Lima',
      state: 'PENDING',
    },
  })
  const refused = await read(hub, outsider, invitationId)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  const anonymous = await read(hub, undefined, invitationId)
  assert.deepEqual([anonymous.statusCode, codeOf(anonymous)], [401, 'SESSION_REQUIRED'])
  const states: [string, string][] = [
    [`expires_at = now() - interval '1 second'`, 'EXPIRED'],
    [`status = 'canceled'`, 'CANCELED'],
    [`status = 'accepted'`, 'ACCEPTED'],
  ]
  for (const [change, state] of states) {
    await hub.test.asOwner(`update auth.invitation set ${change} where id = $1`, [invitationId])
    assert.equal(Object((await read(hub, davi, invitationId)).json()).invitation.state, state)
  }
})

test('aceitar: 200 e um membro; de novo, a mesma resposta; outra pessoa, 404 sem escrita', async (t) => {
  const { hub, companyId, invite } = await companyOn(t)
  const davi = await personOn(hub, DAVI)
  const outsider = await personOn(hub, { name: 'Edu Melo', email: 'edu@example.test' })
  const invitationId = await invite()
  const refused = await accept(hub, outsider, invitationId)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  assert.deepEqual(await statusOf(hub, invitationId), [{ status: 'pending' }])
  const accepted = await accept(hub, davi, invitationId)
  assert.equal(accepted.statusCode, 200)
  assert.deepEqual(accepted.json(), { company: { id: companyId, name: 'Empresa Teste' } })
  const again = await accept(hub, davi, invitationId)
  assert.deepEqual([again.statusCode, again.body], [200, accepted.body])
  assert.deepEqual(await members(hub, davi.id), [{ role: 'admin' }])
  assert.deepEqual(await statusOf(hub, invitationId), [{ status: 'accepted' }])
})

test('aceitar: vencido ou cancelado, 422 INVITATION_CLOSED', async (t) => {
  const { hub, invite } = await companyOn(t)
  const davi = await personOn(hub, DAVI)
  for (const change of [`expires_at = now() - interval '1 second'`, `status = 'canceled'`]) {
    const invitationId = await invite()
    await hub.test.asOwner(`update auth.invitation set ${change} where id = $1`, [invitationId])
    const closed = await accept(hub, davi, invitationId)
    assert.deepEqual([closed.statusCode, codeOf(closed)], [422, 'INVITATION_CLOSED'])
  }
  assert.deepEqual(await members(hub, davi.id), [])
})

test('aceitar: a empresa com 100 pessoas, 409 COMPANY_FULL, e o convite segue pending', async (t) => {
  const { hub, ana, companyId, invite } = await companyOn(t)
  const davi = await personOn(hub, DAVI)
  const invitationId = await invite()
  await hub.test.asOwner(
    `with people as (
      insert into auth.user (id, name, email)
        select md5('p' || n), 'Pessoa ' || n, 'p' || n || '@example.test'
        from generate_series(1, 99) as n returning id)
    insert into auth.member (id, company_id, user_id, role, created_at)
      select md5('m' || id), $1, id, 'member', now() from people`,
    [companyId],
  )
  assert.equal(ana.id.length, 32)
  const full = await accept(hub, davi, invitationId)
  assert.deepEqual([full.statusCode, codeOf(full)], [409, 'COMPANY_FULL'])
  assert.deepEqual(await statusOf(hub, invitationId), [{ status: 'pending' }])
  assert.deepEqual(await members(hub, davi.id), [])
})

test('aceitar: dois juntos, um só membro e dois 200', async (t) => {
  const { hub, invite } = await companyOn(t)
  const davi = await personOn(hub, DAVI)
  const invitationId = await invite()
  const both = await Promise.all([accept(hub, davi, invitationId), accept(hub, davi, invitationId)])
  assert.deepEqual(
    both.map((response) => response.statusCode),
    [200, 200],
  )
  assert.deepEqual(await members(hub, davi.id), [{ role: 'admin' }])
})

type Reply = Awaited<ReturnType<typeof accept>>

/** Resolves once `count` requests of this database wait on a lock, or `request` has answered. */
async function queued(hub: Hub, count: number, request: Promise<Reply>): Promise<void> {
  let answered = false
  void request.then(() => {
    answered = true
  })
  const waiting = `select count(distinct l.pid)::int as waiting from pg_locks l
    join pg_stat_activity a on a.pid = l.pid
    where not l.granted and a.datname = current_database()`
  const deadline = Date.now() + 5_000
  while (!answered && Object((await hub.test.asOwner(waiting))[0]).waiting < count) {
    assert.ok(Date.now() < deadline, `${count} requests never queued on the company`)
    await setTimeout(20)
  }
}

function outcomeOf(response: Reply): string {
  return `${response.statusCode}${response.statusCode < 300 ? '' : String(codeOf(response))}`
}

// The company is held with the strongest row lock, so each request stops at its first touch of the
// company, the first in line goes first on release, and both orders run every time.
test('aceitar: com um re-convite ao mesmo tempo, nas duas ordens, membro e 409 MEMBER_EXISTS, ou o convite canceled e 422; nunca 40P01', async (t) => {
  const { hub, ana, companyId, invite } = await companyOn(t)
  const orders = [
    { first: 'accept', answers: ['200', '409MEMBER_EXISTS'], status: 'accepted', joined: 1 },
    { first: 'invite', answers: ['201', '422INVITATION_CLOSED'], status: 'canceled', joined: 0 },
  ]
  for (const [round, order] of orders.entries()) {
    const email = `pessoa${round}@example.test`
    const person = await personOn(hub, { name: `Pessoa ${round}`, email })
    const invitationId = await invite(email)
    function accepting() {
      return accept(hub, person, invitationId)
    }
    function inviting() {
      return post(hub, ana, `/api/companies/${companyId}/invitations`, { email, role: 'member' })
    }
    const [first, second] = order.first === 'accept' ? [accepting, inviting] : [inviting, accepting]
    const lockCompany = 'select id from auth.company where id = $1 for update'
    const answered = await withOwnerLock(hub.test, lockCompany, [companyId], async (release) => {
      const ahead = first()
      await queued(hub, 1, ahead)
      const behind = second()
      await queued(hub, 2, behind)
      await release()
      return Promise.all([ahead, behind])
    })
    assert.deepEqual(answered.map(outcomeOf), order.answers, `${order.first} first`)
    const [status] = await statusOf(hub, invitationId)
    const joined = await members(hub, person.id)
    assert.deepEqual([status?.status, joined.length], [order.status, order.joined])
  }
})

test('aceitar: uma escrita recusada no meio do aceite, ou no commit, não deixa nada e dá 500', async (t) => {
  const { hub, invite } = await companyOn(t)
  const davi = await personOn(hub, DAVI)
  const invitationId = await invite()
  await hub.test.asOwner('revoke insert on auth.member from hub_runtime')
  const refused = await accept(hub, davi, invitationId)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [500, 'INTERNAL_UNEXPECTED'])
  await hub.test.asOwner('grant insert on auth.member to hub_runtime')
  // A refusal at commit, after the plugin wrote the member: only one transaction undoes it.
  await hub.test.asOwner(`create function auth.refuse_acceptance() returns trigger
    language plpgsql as $$ begin raise exception 'refused'; end $$`)
  await hub.test.asOwner(`create constraint trigger refuse_acceptance after update
    on auth.invitation deferrable initially deferred for each row
    execute function auth.refuse_acceptance()`)
  const late = await accept(hub, davi, invitationId)
  assert.deepEqual([late.statusCode, codeOf(late)], [500, 'INTERNAL_UNEXPECTED'])
  assert.deepEqual(await statusOf(hub, invitationId), [{ status: 'pending' }])
  assert.deepEqual(await members(hub, davi.id), [])
})
