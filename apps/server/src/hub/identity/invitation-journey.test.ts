import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { SESSION_COOKIE } from '@conexus/hub-api'
import {
  serveEnvironment,
  spawnHub,
  TEST_ORIGIN,
  WRITE_HEADERS,
} from '../../platform/test-database.ts'
import type { MailHub } from './test-hub.ts'
import { ANA, companyOn, hubWithMail, INVITEE, PASSWORD, personOn } from './test-hub.ts'

test('do convite à empresa: o convite, o e-mail novo cria a senha, entra, aceita e vê a empresa listada', async (t) => {
  const { hub, companyId, invite } = await companyOn(t)
  const invitationId = await invite()
  const entry = {
    origin: TEST_ORIGIN,
    'content-type': 'application/json',
    'cf-connecting-ip': '203.0.113.9',
  }
  const set = await hub.app.inject({
    method: 'PUT',
    url: `/api/invitations/${invitationId}/password`,
    headers: entry,
    payload: JSON.stringify({ name: 'Davi Costa', password: 'senha-nova-1', revision: 0 }),
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
  assert.equal(Object(received.json()).invitation.kind, 'INVITED')
  const accepted = await hub.app.inject({
    method: 'PUT',
    url: `/api/invitations/${invitationId}/acceptance`,
    headers: { ...entry, cookie: davi.cookie },
    payload: { revision: 1 },
  })
  assert.equal(accepted.statusCode, 200)
  const listed = await hub.app.inject({
    method: 'GET',
    url: '/api/companies',
    headers: { cookie: davi.cookie },
  })
  assert.deepEqual(listed.json(), {
    companies: [{ company: { id: companyId, name: 'Empresa Teste' }, role: 'admin' }],
    mayOperate: false,
    next: { kind: 'END' },
  })
})

test('public invitation matrix hides closed details, distinguishes another session and never writes on GET', async (t) => {
  const { hub, invite } = await companyOn(t)
  const id = await invite()
  const other = await personOn(hub, { name: 'Bruno Reis', email: 'bruno@example.test' })
  async function view(cookie?: string) {
    const reply = await hub.app.inject({
      method: 'GET',
      url: `/api/invitations/${id}`,
      headers: cookie ? { cookie } : {},
    })
    assert.equal(reply.statusCode, 200)
    return Object(reply.json()).invitation
  }
  const initial = await view()
  assert.equal(initial.kind, 'NEW')
  assert.equal(initial.email, INVITEE)
  assert.equal(initial.revision, 0)
  assert.deepEqual(await view(`${SESSION_COOKIE}=invalid-cookie`), initial)
  for (const unknown of ['not-an-id', randomBytes(16).toString('hex')]) {
    assert.equal(
      (await hub.app.inject({ method: 'GET', url: `/api/invitations/${unknown}` })).statusCode,
      404,
    )
  }
  assert.deepEqual(await view(other.cookie), { kind: 'OTHER', signedInAs: 'bruno@example.test' })
  for (const [status, state] of [
    ['accepted', 'ACCEPTED'],
    ['rejected', 'DECLINED'],
    ['canceled', 'CANCELED'],
  ]) {
    await hub.test.asOwner('update auth.invitation set status = $1 where id = $2', [status, id])
    assert.deepEqual(await view(), { kind: 'CLOSED', state })
    assert.deepEqual(await view(other.cookie), { kind: 'OTHER', signedInAs: 'bruno@example.test' })
  }
  await hub.test.asOwner(
    `update auth.invitation set status = 'pending', expires_at = now() - interval '1 second' where id = $1`,
    [id],
  )
  assert.deepEqual(await view(), { kind: 'CLOSED', state: 'EXPIRED' })
  assert.deepEqual(
    await hub.test.asOwner('select revision, status from auth.invitation where id = $1', [id]),
    [{ revision: 0, status: 'pending' }],
  )
  assert.deepEqual(
    await hub.test.asOwner('select count(*)::int as users from auth.user where email = $1', [
      INVITEE,
    ]),
    [{ users: 0 }],
  )
})

test('public declination replays the original revision without creating an account and refuses foreign sessions and origins', async (t) => {
  const { hub, invite } = await companyOn(t)
  const id = await invite()
  const other = await personOn(hub, { name: 'Bruno Reis', email: 'bruno@example.test' })
  function decline(headers: Record<string, string> = WRITE_HEADERS, revision = 0) {
    return hub.app.inject({
      method: 'PUT',
      url: `/api/invitations/${id}/declination`,
      headers,
      payload: { revision },
    })
  }
  assert.equal((await decline({ ...WRITE_HEADERS, cookie: other.cookie })).statusCode, 404)
  assert.equal(
    (await decline({ ...WRITE_HEADERS, origin: 'https://elsewhere.example.test' })).statusCode,
    403,
  )
  assert.equal((await decline(WRITE_HEADERS, 1)).statusCode, 412)
  assert.equal((await decline()).statusCode, 204)
  assert.equal((await decline()).statusCode, 204)
  assert.deepEqual(
    await hub.test.asOwner('select revision, status from auth.invitation where id = $1', [id]),
    [{ revision: 1, status: 'rejected' }],
  )
  assert.deepEqual(
    await hub.test.asOwner('select count(*)::int as users from auth.user where email = $1', [
      INVITEE,
    ]),
    [{ users: 0 }],
  )
})

test('native invitation attempt counters survive refused business transactions', async (t) => {
  const { hub, invite } = await companyOn(t)
  const id = await invite()
  for (const action of ['password', 'declination']) {
    const payload =
      action === 'password'
        ? { name: 'Davi Costa', password: 'senha-nova-1', revision: 99 }
        : { revision: 99 }
    for (let count = 0; count < 10; count++) {
      const reply = await hub.app.inject({
        method: 'PUT',
        url: `/api/invitations/${id}/${action}`,
        headers: WRITE_HEADERS,
        payload,
      })
      assert.equal(reply.statusCode, 412)
    }
    const limited = await hub.app.inject({
      method: 'PUT',
      url: `/api/invitations/${id}/${action}`,
      headers: WRITE_HEADERS,
      payload,
    })
    assert.deepEqual(
      [limited.statusCode, Object(limited.json()).code],
      [429, 'SIGN_IN_ATTEMPTS_EXCEEDED'],
    )
  }
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

async function walk(hub: MailHub, send: ReturnType<typeof clientOf>) {
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
  const named = { name: 'Davi Costa', password: 'senha-nova-1', revision: 0 }
  await send('PUT', `/api/invitations/${invitation.id}/password`, undefined, named)
  const davi = await signIn(INVITEE, 'senha-nova-1')
  const accepted = await send('PUT', `/api/invitations/${invitation.id}/acceptance`, davi, {
    revision: 1,
  })
  const unknown = `/api/invitations/${randomBytes(16).toString('hex')}/password`
  const refusals = [
    await send('GET', `/api/companies/${company.id}`, bruno),
    await send('POST', '/api/companies', bruno, { name: 'Empresa Nova' }),
    await send('POST', invitations, davi, { email: 'edu@example.test', role: 'member' }),
    await send('GET', `/api/invitations/${invitation.id}`, bruno),
    await send('PUT', unknown, undefined, named),
    await send('GET', '/api/companies/nao-e-um-id', bruno),
  ]
  return {
    invitationId: invitation.id,
    statuses: [accepted, ...refusals].map((response) => response.status),
  }
}

test('registro: criar, convidar, gravar senha, aceitar e cada 404 deixam só códigos, ids e motivos, nunca e-mail, nome ou token', async (t) => {
  const hub = await hubWithMail(t)
  await personOn(hub, ANA)
  await personOn(hub, { name: 'Bruno Reis', email: 'bruno@example.test' })
  const environment = {
    ...serveEnvironment(t, hub.test.runtimeUrl),
    HUB_MAIL_API_URL: hub.mail.url,
  }
  const { port, lines, stop } = await spawnHub(t, environment)
  // A Hub still running holds the database the test's cleanup drops, so it stops even on a failure.
  const { invitationId, statuses } = await walk(hub, clientOf(port)).finally(stop)
  assert.deepEqual(statuses, [200, 404, 404, 404, 200, 404, 404])
  const messages = lines.map((line) => String(line.msg))
  for (const code of [
    'COMPANY_CREATED',
    'INVITATION_CREATED',
    'INVITATION_PASSWORD_CREATED',
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
    undefined,
    'MALFORMED',
  ])
  const output = JSON.stringify(lines)
  const people = [ANA.email, 'bruno@example.test', INVITEE, 'edu@example.test']
  const names = ['Ana Lima', 'Bruno Reis', 'Davi Costa', 'Empresa Teste']
  for (const kept of [...people, ...names, invitationId, 'senha-nova-1'])
    assert.doesNotMatch(output, new RegExp(kept))
})

test('criar: quem já é dono de três empresas cria a quarta num Hub de verdade, sem linha crua', async (t) => {
  const hub = await hubWithMail(t)
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
