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

/** Ana, the installation administrator, owns Empresa Teste. */
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

const ENTRY = {
  origin: TEST_ORIGIN,
  'content-type': 'application/json',
  'cf-connecting-ip': '203.0.113.7',
}
const SET_PASSWORD =
  /^https:\/\/hub\.example\.test\/set-password\?redirect=\/invitations\/([A-Za-z0-9]{32})#token=([A-Za-z0-9]+)$/m

function askLink(hub: Hub, invitationId: string, name = 'Davi Costa') {
  return hub.app.inject({
    method: 'PUT',
    url: `/api/invitations/${invitationId}/password-link`,
    headers: ENTRY,
    payload: JSON.stringify({ name }),
  })
}

function setPassword(hub: Hub, token: string) {
  return hub.app.inject({
    method: 'PUT',
    url: '/api/passwords',
    headers: ENTRY,
    payload: JSON.stringify({ token, password: 'senha-nova-1' }),
  })
}

function tokenOf(mail: Mail | undefined, invitationId: string): string {
  const match = mail?.text.match(SET_PASSWORD)
  assert.equal(match?.[1], invitationId, mail?.text)
  return match?.[2] ?? ''
}

test('link: sem pessoa, ela é criada com o nome, e o e-mail leva /set-password?redirect=/invitations/{id}#token=', async (t) => {
  const { hub, invite } = await companyOn(t)
  const invitationId = await invite()
  const given = await askLink(hub, invitationId)
  assert.deepEqual([given.statusCode, given.body], [204, ''])
  assert.deepEqual(
    await hub.test.asOwner('select name, role from auth.user where email = $1', [INVITEE]),
    [{ name: 'Davi Costa', role: 'user' }],
  )
  const mail = hub.mail.sent[1]
  assert.deepEqual(
    { ...mail, text: undefined },
    {
      to: INVITEE,
      subject: 'Crie sua senha do Conexus',
      text: undefined,
    },
  )
  assert.match(
    mail?.text ?? '',
    /^Link para Davi Costa criar a senha do Conexus\. Vale 15 minutos e uma vez só\.$/m,
  )
  assert.equal((await setPassword(hub, tokenOf(mail, invitationId))).statusCode, 204)
})

test('link: quem já tem senha, 204 e nenhum e-mail', async (t) => {
  const { hub, invite } = await companyOn(t)
  await personOn(hub, { name: 'Davi Costa', email: INVITEE })
  const given = await askLink(hub, await invite(), 'Outro Nome')
  assert.equal(given.statusCode, 204)
  assert.deepEqual(
    hub.mail.sent.map((mail) => mail.subject),
    ['Convite para Empresa Teste'],
  )
  assert.deepEqual(await hub.test.asOwner('select count(*)::int as links from auth.verification'), [
    { links: 0 },
  ])
})

test('link: convite cancelado, vencido, desconhecido ou malformado, 404 e ninguém criado', async (t) => {
  const { hub, invite } = await companyOn(t)
  const canceled = await invite()
  await invite()
  const expired = await invite('edu@example.test')
  await hub.test.asOwner(
    `update auth.invitation set expires_at = now() - interval '1 second' where id = $1`,
    [expired],
  )
  const randomId = randomBytes(16).toString('hex')
  for (const invitationId of [canceled, expired, randomId, 'nao-e-um-id']) {
    const refused = await askLink(hub, invitationId)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'], invitationId)
  }
  assert.deepEqual(
    await hub.test.asOwner('select count(*)::int as people from auth.user where role = $1', [
      'user',
    ]),
    [{ people: 0 }],
  )
})

test('link: dois pedidos juntos, uma pessoa só e um 429 PASSWORD_LINKS_EXCEEDED', async (t) => {
  const { hub, invite } = await companyOn(t)
  const invitationId = await invite()
  const both = await Promise.all([askLink(hub, invitationId), askLink(hub, invitationId)])
  const answers = both.map((response) => [response.statusCode, response.body && codeOf(response)])
  assert.deepEqual(answers.sort(), [
    [204, ''],
    [429, 'PASSWORD_LINKS_EXCEEDED'],
  ])
  assert.deepEqual(
    await hub.test.asOwner('select count(*)::int as people from auth.user where email = $1', [
      INVITEE,
    ]),
    [{ people: 1 }],
  )
  assert.equal(hub.mail.sent.length, 2)
})

test('link: passados 20 s, um link novo, e o anterior deixa de valer, 422', async (t) => {
  const { hub, invite } = await companyOn(t)
  const invitationId = await invite()
  assert.equal((await askLink(hub, invitationId)).statusCode, 204)
  const old = tokenOf(hub.mail.sent[1], invitationId)
  const early = await askLink(hub, invitationId)
  assert.deepEqual([early.statusCode, codeOf(early)], [429, 'PASSWORD_LINKS_EXCEEDED'])
  await hub.test.asOwner(`update auth.verification set created_at = now() - interval '21 seconds'`)
  assert.equal((await askLink(hub, invitationId)).statusCode, 204)
  const fresh = tokenOf(hub.mail.sent[2], invitationId)
  const reused = await setPassword(hub, old)
  assert.deepEqual([reused.statusCode, codeOf(reused)], [422, 'PASSWORD_LINK_INVALID'])
  assert.equal((await setPassword(hub, fresh)).statusCode, 204)
})
