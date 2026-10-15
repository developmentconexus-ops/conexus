import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { hashPassword } from 'better-auth/crypto'
import { createHub, identityOf } from '../../main.ts'
import {
  createTestDatabase,
  serveEnvironment,
  spawnHub,
  TEST_ORIGIN,
  testConfig,
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

test('do convite à empresa: o convite, o e-mail novo cria a senha, entra, aceita e vê a empresa listada', async (t) => {
  const { hub, companyId, invite } = await companyOn(t)
  const invitationId = await invite()
  const entry = {
    origin: TEST_ORIGIN,
    'content-type': 'application/json',
    'cf-connecting-ip': '203.0.113.9',
  }
  const link = await hub.app.inject({
    method: 'PUT',
    url: `/api/invitations/${invitationId}/password-link`,
    headers: entry,
    payload: JSON.stringify({ name: 'Davi Costa' }),
  })
  assert.equal(link.statusCode, 204)
  const token = hub.mail.sent[1]?.text.match(/#token=([A-Za-z0-9]+)$/m)?.[1]
  const set = await hub.app.inject({
    method: 'PUT',
    url: '/api/passwords',
    headers: entry,
    payload: JSON.stringify({ token, password: 'senha-nova-1' }),
  })
  assert.equal(set.statusCode, 204)
  const signedIn = await hub.app.inject({
    method: 'PUT',
    url: '/api/sessions/current',
    headers: entry,
    payload: JSON.stringify({ email: INVITEE, password: 'senha-nova-1' }),
  })
  assert.equal(signedIn.statusCode, 200)
  const davi = { cookie: String(signedIn.headers['set-cookie']).split(';')[0] ?? '' }
  const received = await hub.app.inject({
    method: 'GET',
    url: `/api/invitations/${invitationId}`,
    headers: { cookie: davi.cookie },
  })
  assert.equal(Object(received.json()).invitation.state, 'PENDING')
  const accepted = await hub.app.inject({
    method: 'PUT',
    url: `/api/invitations/${invitationId}/acceptance`,
    headers: { origin: TEST_ORIGIN, cookie: davi.cookie },
  })
  assert.equal(accepted.statusCode, 200)
  const listed = await hub.app.inject({
    method: 'GET',
    url: '/api/companies',
    headers: { cookie: davi.cookie },
  })
  assert.deepEqual(listed.json(), {
    companies: [{ company: { id: companyId, name: 'Empresa Teste' }, role: 'admin' }],
    mayCreate: false,
    next: { kind: 'END' },
  })
})

function clientOf(port: number) {
  return async function send(method: string, path: string, cookie?: string, body?: unknown) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: {
        origin: TEST_ORIGIN,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        'cf-connecting-ip': '198.51.100.20',
        'idempotency-key': randomUUID(),
        ...(cookie === undefined ? {} : { cookie }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(10_000),
    })
    const text = await response.text()
    const set = String(response.headers.get('set-cookie')).split(';')[0] ?? ''
    return { status: response.status, json: text ? JSON.parse(text) : undefined, cookie: set }
  }
}

async function walk(hub: Hub, send: ReturnType<typeof clientOf>) {
  async function signIn(email: string, password = PASSWORD) {
    return (await send('PUT', '/api/sessions/current', undefined, { email, password })).cookie
  }
  const ana = await signIn(ANA.email)
  const bruno = await signIn('bruno@example.test')
  const { company } = (await send('POST', '/api/companies', ana, { name: 'Empresa Teste' })).json
  const invitations = `/api/companies/${company.id}/invitations`
  const invited = await send('POST', invitations, ana, { email: INVITEE, role: 'member' })
  const sent = [invited.status, hub.mail.sent.length]
  assert.deepEqual(sent, [201, 1], 'the invitation is answered and its mail sent while Ana waits')
  const { invitation } = invited.json
  const named = { name: 'Davi Costa' }
  await send('PUT', `/api/invitations/${invitation.id}/password-link`, undefined, named)
  const token = hub.mail.sent[1]?.text.match(/#token=([A-Za-z0-9]+)$/m)?.[1] ?? ''
  await send('PUT', '/api/passwords', undefined, { token, password: 'senha-nova-1' })
  const davi = await signIn(INVITEE, 'senha-nova-1')
  const accepted = await send('PUT', `/api/invitations/${invitation.id}/acceptance`, davi)
  const unknown = `/api/invitations/${randomBytes(16).toString('hex')}/password-link`
  const refusals = [
    await send('GET', `/api/companies/${company.id}`, bruno),
    await send('POST', '/api/companies', bruno, { name: 'Empresa Nova' }),
    await send('POST', invitations, davi, { email: 'edu@example.test', role: 'member' }),
    await send('GET', `/api/invitations/${invitation.id}`, bruno),
    await send('PUT', unknown, undefined, named),
    await send('GET', '/api/companies/nao-e-um-id', bruno),
  ]
  return { token, statuses: [accepted, ...refusals].map((response) => response.status) }
}

test('registro: criar, convidar, dar o link, aceitar e cada 404 deixam só códigos, ids e motivos, nunca e-mail, nome ou token', async (t) => {
  const hub = await hubOn(t)
  await personOn(hub, ANA)
  await personOn(hub, { name: 'Bruno Reis', email: 'bruno@example.test' })
  const environment = {
    ...serveEnvironment(t, hub.test.runtimeUrl),
    HUB_MAIL_API_URL: hub.mail.url,
  }
  const { port, lines, stop } = await spawnHub(t, environment)
  // A Hub still running holds the database the test's cleanup drops, so it stops even on a failure.
  const { token, statuses } = await walk(hub, clientOf(port)).finally(stop)
  assert.deepEqual(statuses, [200, 404, 404, 404, 404, 404, 404])
  const messages = lines.map((line) => String(line.msg))
  for (const code of [
    'COMPANY_CREATED',
    'INVITATION_CREATED',
    'PASSWORD_LINK_GIVEN',
    'INVITATION_ACCEPTED',
    'MAIL_SENT',
  ]) {
    assert.ok(messages.includes(code), code)
  }
  const reasons = lines.filter((line) => line.msg === 'NOT_FOUND').map((line) => line.reason)
  assert.deepEqual(reasons, [
    'OUTSIDER',
    'YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION',
    'FORBIDDEN',
    'OUTSIDER',
    'UNKNOWN',
    'MALFORMED',
  ])
  const output = JSON.stringify(lines)
  const people = [ANA.email, 'bruno@example.test', INVITEE, 'edu@example.test']
  const names = ['Ana Lima', 'Bruno Reis', 'Davi Costa', 'Empresa Teste']
  for (const kept of [...people, ...names, token]) assert.doesNotMatch(output, new RegExp(kept))
})

test('criar: quem já é dono de três empresas cria a quarta num Hub de verdade, sem linha crua', async (t) => {
  const hub = await hubOn(t)
  await personOn(hub, ANA)
  const { port, stop } = await spawnHub(t, serveEnvironment(t, hub.test.runtimeUrl))
  const send = clientOf(port)
  const credentials = { email: ANA.email, password: PASSWORD }
  const ana = (await send('PUT', '/api/sessions/current', undefined, credentials)).cookie
  const created = []
  for (const name of ['Empresa A', 'Empresa B', 'Empresa C', 'Empresa D']) {
    created.push((await send('POST', '/api/companies', ana, { name })).status)
  }
  await stop()
  assert.deepEqual(created, [201, 201, 201, 201])
})
