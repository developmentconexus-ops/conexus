import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { hashPassword } from 'better-auth/crypto'
import { createHub, identityOf } from '../../main.ts'
import { createTestDatabase, TEST_ORIGIN, testConfig } from '../../platform/test-database.ts'
import { createStatus } from '../status/public.ts'

const silent = { info: () => undefined, error: () => undefined }
const PASSWORD = 'senha-certa-1'
const ANA = { name: 'Ana Lima', email: 'ana@example.test', role: 'admin' }
const BRUNO = { name: 'Bruno Reis', email: 'bruno@example.test' }
const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }
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

/** Ana, the administrator, owns Empresa Teste; Bruno is its administrator, Carla its member. */
async function companyOn(t: TestContext) {
  const hub = await hubOn(t)
  const ana = await personOn(hub, ANA)
  const bruno = await personOn(hub, BRUNO)
  const carla = await personOn(hub, CARLA)
  const created = await post(hub, ana, '/api/companies', { name: 'Empresa Teste' })
  const companyId = String(Object(created.json()).company.id)
  for (const [person, role] of [
    [bruno, 'admin'],
    [carla, 'member'],
  ] as const) {
    await hub.test.asOwner(
      `insert into auth.member (id, company_id, user_id, role, created_at)
        values ($1, $2, $3, $4, now())`,
      [id(), companyId, person.id, role],
    )
  }
  function invite(by: Person, email: string, role = 'member', key?: string) {
    return post(hub, by, `/api/companies/${companyId}/invitations`, { email, role }, key)
  }
  return { hub, ana, bruno, carla, companyId, invite }
}

function codeOf(response: { json(): unknown }): unknown {
  return Object(response.json()).code
}

async function rows(hub: Hub, email = INVITEE) {
  return hub.test.asOwner(
    'select status from auth.invitation where email = $1 order by created_at, status',
    [email],
  )
}

async function seed(hub: Hub, companyId: string, inviterId: string, count: number, live: boolean) {
  await hub.test.asOwner(
    `insert into auth.invitation (id, company_id, email, role, status, expires_at, created_at,
      inviter_id, attempt_key)
      select md5(random()::text), $1, 'seed' || n || $4 || '@example.test', 'member', 'pending',
        now() + case when $4 = 'live' then interval '1 day' else interval '-1 day' end,
        now() - interval '1 day', $2, gen_random_uuid()::text
      from generate_series(1, $3) as n`,
    [companyId, inviterId, count, live ? 'live' : 'dead'],
  )
}

test('convidar: 201, e o e-mail leva o endereço /invitations/{id}', async (t) => {
  const { hub, ana, invite } = await companyOn(t)
  const response = await invite(ana, 'Davi@Example.test', 'admin')
  assert.equal(response.statusCode, 201)
  const { invitation } = Object(response.json())
  assert.match(invitation.id, /^[A-Za-z0-9]{32}$/)
  assert.deepEqual(
    { ...invitation, id: undefined, expiresAt: undefined },
    {
      id: undefined,
      email: INVITEE,
      role: 'admin',
      expiresAt: undefined,
    },
  )
  const days = (Date.parse(invitation.expiresAt) - Date.now()) / 86_400_000
  assert.ok(days > 1.99 && days <= 2, String(days))
  assert.deepEqual(hub.mail.sent, [
    {
      to: INVITEE,
      subject: 'Convite para Empresa Teste',
      text: `Ana Lima convidou você para Empresa Teste como Administrador.\nO convite vale 2 dias.\n\nhttps://hub.example.test/invitations/${invitation.id}\n`,
    },
  ])
})

test('convidar: o membro, ou quem é de outra empresa, 404 e nenhuma linha', async (t) => {
  const { hub, carla, companyId, invite } = await companyOn(t)
  const outsider = await personOn(hub, { name: 'Edu Melo', email: 'edu@example.test' })
  for (const refused of [await invite(carla, INVITEE), await invite(outsider, INVITEE)]) {
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  }
  const unknown = await post(hub, carla, `/api/companies/${id()}/invitations`, {
    email: INVITEE,
    role: 'member',
  })
  assert.deepEqual([unknown.statusCode, codeOf(unknown)], [404, 'NOT_FOUND'])
  assert.deepEqual(await rows(hub), [])
  assert.equal(companyId.length, 32)
  assert.deepEqual(hub.mail.sent, [])
})

test('convidar: o administrador pedindo dono, 403 INVITATION_ROLE_REFUSED; quem já é membro, 409 MEMBER_EXISTS', async (t) => {
  const { hub, ana, bruno, invite } = await companyOn(t)
  const owner = await invite(bruno, INVITEE, 'owner')
  assert.deepEqual([owner.statusCode, codeOf(owner)], [403, 'INVITATION_ROLE_REFUSED'])
  const member = await invite(ana, 'CARLA@example.test')
  assert.deepEqual([member.statusCode, codeOf(member)], [409, 'MEMBER_EXISTS'])
  assert.deepEqual(await rows(hub), [])
  assert.equal((await invite(ana, INVITEE, 'owner')).statusCode, 201)
  assert.equal((await invite(bruno, 'edu@example.test', 'admin')).statusCode, 201)
})

test('convidar: o endereço que volta, 422 MAIL_BOUNCED; o correio fora, 502 MAIL_UNAVAILABLE; o convite fica', async (t) => {
  const { hub, ana, invite } = await companyOn(t)
  hub.mail.state.mode = 'BOUNCE'
  const bounced = await invite(ana, INVITEE)
  assert.deepEqual([bounced.statusCode, codeOf(bounced)], [422, 'MAIL_BOUNCED'])
  hub.mail.state.mode = 'FAIL'
  const down = await invite(ana, 'edu@example.test')
  assert.deepEqual([down.statusCode, codeOf(down)], [502, 'MAIL_UNAVAILABLE'])
  assert.deepEqual(await rows(hub), [{ status: 'pending' }])
  assert.deepEqual(await rows(hub, 'edu@example.test'), [{ status: 'pending' }])
})

test('de novo com a mesma chave: depois do correio fora, um e-mail; depois de um endereço que volta, nenhum', async (t) => {
  const { hub, ana, invite } = await companyOn(t)
  const [bounceKey, downKey] = [randomUUID(), randomUUID()]
  hub.mail.state.mode = 'BOUNCE'
  assert.equal((await invite(ana, INVITEE, 'member', bounceKey)).statusCode, 422)
  hub.mail.state.mode = 'FAIL'
  assert.equal((await invite(ana, 'edu@example.test', 'member', downKey)).statusCode, 502)
  hub.mail.state.mode = 'DELIVER'
  assert.equal((await invite(ana, INVITEE, 'member', bounceKey)).statusCode, 201)
  assert.equal((await invite(ana, 'edu@example.test', 'member', downKey)).statusCode, 201)
  assert.equal((await invite(ana, 'edu@example.test', 'member', downKey)).statusCode, 201)
  assert.deepEqual(
    hub.mail.sent.map((mail) => mail.to),
    [INVITEE, 'edu@example.test'],
  )
})

test('de novo: com outra chave, o anterior fica canceled e um só pending, também com dois juntos', async (t) => {
  const { hub, ana, bruno, invite } = await companyOn(t)
  assert.equal((await invite(ana, INVITEE)).statusCode, 201)
  const again = await invite(ana, INVITEE)
  assert.equal(again.statusCode, 201)
  assert.deepEqual(await rows(hub), [{ status: 'canceled' }, { status: 'pending' }])
  const twice = await Promise.all([invite(ana, INVITEE), invite(bruno, INVITEE)])
  assert.deepEqual(
    twice.map((response) => response.statusCode),
    [201, 201],
  )
  const statuses = (await rows(hub)).map((row) => row.status).sort()
  assert.deepEqual(statuses, ['canceled', 'canceled', 'canceled', 'pending'])
  assert.equal(hub.mail.sent.length, 4)
})

test('de novo: o anterior vencido há 2 dias, ou vencendo agora, 201 e um e-mail novo', async (t) => {
  const { hub, ana, invite } = await companyOn(t)
  for (const age of ["interval '2 days'", "interval '0 seconds'"]) {
    assert.equal((await invite(ana, INVITEE)).statusCode, 201)
    await hub.test.asOwner(
      `update auth.invitation set expires_at = now() - ${age} where status = 'pending'`,
    )
    assert.equal((await invite(ana, INVITEE)).statusCode, 201)
    await hub.test.asOwner(`update auth.invitation set status = 'canceled'`)
  }
  assert.equal(hub.mail.sent.length, 4)
})

test('de novo: o anterior com um id fora de forma no banco, 500 e ele segue pendente, sem e-mail', async (t) => {
  const { hub, ana, companyId, invite } = await companyOn(t)
  await hub.test.asOwner(
    `insert into auth.invitation (id, company_id, email, role, status, expires_at, created_at,
      inviter_id, attempt_key) values ('fora-de-forma', $1, $2, 'member', 'pending',
      now() + interval '1 day', now(), $3, gen_random_uuid()::text)`,
    [companyId, INVITEE, ana.id],
  )
  const refused = await invite(ana, INVITEE)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [500, 'INTERNAL_UNEXPECTED'])
  assert.deepEqual(await rows(hub), [{ status: 'pending' }])
  assert.deepEqual(hub.mail.sent, [])
})

test('de novo: a mesma chave dá o mesmo convite, sem outro e-mail; com outros dados, 409 IDEMPOTENCY_CONFLICT', async (t) => {
  const { hub, ana, invite } = await companyOn(t)
  const key = randomUUID()
  const first = await invite(ana, INVITEE, 'member', key)
  const same = await invite(ana, INVITEE, 'member', key)
  assert.deepEqual([first.statusCode, same.statusCode], [201, 201])
  assert.deepEqual(same.json(), first.json())
  assert.equal(hub.mail.sent.length, 1)
  const other = await invite(ana, INVITEE, 'admin', key)
  assert.deepEqual([other.statusCode, codeOf(other)], [409, 'IDEMPOTENCY_CONFLICT'])
  assert.deepEqual(await rows(hub), [{ status: 'pending' }])
})

test('limite: o 11º convite de uma pessoa em 60 s, 429 INVITATIONS_EXCEEDED; passado o minuto, passa', async (t) => {
  const { hub, ana, invite } = await companyOn(t)
  for (let index = 0; index < 10; index++) {
    assert.equal((await invite(ana, `pessoa${index}@example.test`)).statusCode, 201)
  }
  const eleventh = await invite(ana, INVITEE)
  assert.deepEqual([eleventh.statusCode, codeOf(eleventh)], [429, 'INVITATIONS_EXCEEDED'])
  assert.deepEqual(await rows(hub), [])
  await hub.test.asOwner(`update auth.invitation set created_at = now() - interval '61 seconds'`)
  assert.equal((await invite(ana, INVITEE)).statusCode, 201)
})

test('limite: com 99 vivos, dois convidantes juntos, um 201 e um 409 INVITATIONS_FULL', async (t) => {
  const { hub, ana, bruno, companyId, invite } = await companyOn(t)
  await seed(hub, companyId, ana.id, 99, true)
  const both = await Promise.all([invite(ana, INVITEE), invite(bruno, 'edu@example.test')])
  const answers = both.map((response) => [response.statusCode, codeOf(response)]).sort()
  assert.deepEqual(answers, [
    [201, undefined],
    [409, 'INVITATIONS_FULL'],
  ])
})

test('limite: com 100 vivos atrás de 100 vencidos, 409 INVITATIONS_FULL; com 99, o centésimo passa', async (t) => {
  const { hub, ana, companyId, invite } = await companyOn(t)
  await seed(hub, companyId, ana.id, 100, false)
  await seed(hub, companyId, ana.id, 99, true)
  assert.equal((await invite(ana, 'edu@example.test')).statusCode, 201)
  const full = await invite(ana, INVITEE)
  assert.deepEqual([full.statusCode, codeOf(full)], [409, 'INVITATIONS_FULL'])
  assert.deepEqual(
    hub.mail.sent.map((mail) => mail.to),
    ['edu@example.test'],
  )
})
