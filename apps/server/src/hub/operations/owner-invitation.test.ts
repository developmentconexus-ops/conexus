import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import { ANA, codeOf, hubWithMail, personOn, post } from '../identity/test-hub.ts'

const OWNER = { name: 'Davi Costa', email: 'davi@example.test' }
const BODY = {
  cnpj: '12.ABC.345/01DE-35',
  legalName: 'Empresa Teste Ltda',
  name: 'Empresa Teste',
  ownerEmail: OWNER.email,
}

function manage(hub: Hub, person: Person, method: 'PUT' | 'DELETE', url: string, revision: number) {
  return hub.app.inject({
    method,
    url,
    headers: { origin: TEST_ORIGIN, cookie: person.cookie, 'content-type': 'application/json' },
    payload: JSON.stringify({ revision }),
  })
}

async function awaiting(t: Parameters<typeof hubWithMail>[0]) {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA)
  const response = await post(hub, ana, '/api/clients', BODY)
  const { client } = Object(response.json())
  const invitations = `/api/companies/${client.companyId}/invitations`
  return { hub, ana, client, invitations, first: String(client.state.ownerInvitation.id) }
}

test('o operador reenvia, cancela e convida de novo pelo convite de 4.1; um segundo vivo, 409 OWNER_INVITATION_OPEN; outro papel ou um operador, recusados', async (t) => {
  const { hub, ana, invitations, first } = await awaiting(t)
  const second = await post(hub, ana, invitations, { email: 'edu@example.test', role: 'owner' })
  assert.deepEqual([second.statusCode, codeOf(second)], [409, 'OWNER_INVITATION_OPEN'])
  const renewed = await manage(hub, ana, 'PUT', `${invitations}/${first}`, 0)
  assert.equal(renewed.statusCode, 200)
  assert.equal(Object(renewed.json()).invitation.revision, 1)
  assert.equal(hub.mail.sent.length, 2)
  const canceled = await manage(hub, ana, 'DELETE', `${invitations}/${first}`, 1)
  assert.equal(canceled.statusCode, 204)
  const refused = [
    [await post(hub, ana, invitations, { email: 'edu@example.test', role: 'admin' }), 403],
    [await post(hub, ana, invitations, { email: ANA.email, role: 'owner' }), 422],
  ] as const
  assert.deepEqual(
    refused.map(([response, status]) => [response.statusCode, status, codeOf(response)]),
    [
      [403, 403, 'INVITATION_ROLE_REFUSED'],
      [422, 422, 'CLIENT_OWNER_IS_OPERATOR'],
    ],
  )
  const other = await post(hub, ana, invitations, { email: 'edu@example.test', role: 'owner' })
  assert.equal(other.statusCode, 201)
  assert.deepEqual(
    await hub.test.asOwner(
      'select email, role, status, inviter_id from auth.invitation order by created_at',
    ),
    [
      { email: OWNER.email, role: 'owner', status: 'canceled', inviter_id: ana.id },
      { email: 'edu@example.test', role: 'owner', status: 'pending', inviter_id: ana.id },
    ],
  )
})

test('o operador convida de novo um convite de dono vencido, pelo mesmo link de reemissão de 4.1', async (t) => {
  const { hub, ana, invitations, first } = await awaiting(t)
  await hub.test.asOwner(`update auth.invitation set expires_at = now() - interval '1 hour'`)
  const reissued = await post(hub, ana, invitations, {
    email: OWNER.email,
    role: 'owner',
    replaces: { id: first, revision: 0 },
  })
  assert.equal(reissued.statusCode, 201)
  assert.deepEqual(
    await hub.test.asOwner(
      'select status, superseded_at is not null as superseded from auth.invitation order by created_at',
    ),
    [
      { status: 'canceled', superseded: true },
      { status: 'pending', superseded: false },
    ],
  )
})

test('empresa ativa: o operador convida outro dono, reenvia e cancela, também sem ser membro', async (t) => {
  const { hub, ana, invitations, first } = await awaiting(t)
  const davi = await personOn(hub, OWNER)
  const accepted = await hub.app.inject({
    method: 'PUT',
    url: `/api/invitations/${first}/acceptance`,
    headers: { origin: TEST_ORIGIN, cookie: davi.cookie, 'content-type': 'application/json' },
    payload: JSON.stringify({ revision: 0 }),
  })
  assert.equal(accepted.statusCode, 200)
  const invited = await post(hub, ana, invitations, { email: 'edu@example.test', role: 'owner' })
  assert.equal(invited.statusCode, 201)
  const second = String(Object(invited.json()).invitation.id)
  // The company has an owner already: the mail asks for an owner, not for the first one.
  assert.equal(hub.mail.sent.at(-1)?.subject, 'Convite para Empresa Teste')
  const renewed = await manage(hub, ana, 'PUT', `${invitations}/${second}`, 0)
  assert.equal(renewed.statusCode, 200)
  const canceled = await manage(hub, ana, 'DELETE', `${invitations}/${second}`, 1)
  assert.equal(canceled.statusCode, 204)
  assert.deepEqual(await hub.test.asOwner('select user_id, role from auth.member'), [
    { user_id: davi.id, role: 'owner' },
  ])
})

const ENTRY = {
  origin: TEST_ORIGIN,
  'content-type': 'application/json',
  'cf-connecting-ip': '203.0.113.9',
}

function received(hub: Hub, invitationId: string, cookie?: string) {
  const headers = cookie === undefined ? {} : { cookie }
  return hub.app.inject({ method: 'GET', url: `/api/invitations/${invitationId}`, headers })
}

function companiesOf(hub: Hub, cookie: string) {
  return hub.app.inject({ method: 'GET', url: '/api/companies', headers: { cookie } })
}

/** The owner creates a password in the invitation and signs in: their session cookie. */
async function passwordFrom(hub: Hub, invitationId: string): Promise<string> {
  const password = { name: OWNER.name, password: 'senha-nova-1', revision: 0 }
  const set = await hub.app.inject({
    method: 'PUT',
    url: `/api/invitations/${invitationId}/password`,
    headers: ENTRY,
    payload: JSON.stringify(password),
  })
  assert.equal(set.statusCode, 204)
  const signedIn = await hub.app.inject({
    method: 'PUT',
    url: '/api/sessions/current',
    headers: ENTRY,
    payload: JSON.stringify({ email: OWNER.email, password: password.password }),
  })
  return String(signedIn.headers['set-cookie']).split(';')[0] ?? ''
}

test('primeiro dono: convite e e-mail dizem Conexus, Dono e "primeiro dono"; aceito, o dono vê a empresa e o operador não; a mesma pessoa em dois cadastros é dona dos dois (A16)', async (t) => {
  const { hub, ana, client, first } = await awaiting(t)
  const [mail] = hub.mail.sent
  assert.equal(mail?.subject, 'Conexus convidou você para ser o primeiro dono de Empresa Teste')
  assert.ok(mail?.text.includes('Conexus convidou você para ser o primeiro dono de Empresa Teste'))
  const view = Object((await received(hub, first)).json()).invitation
  assert.deepEqual(
    [view.kind, view.inviterName, view.role, view.firstOwner],
    ['NEW', 'Conexus', 'owner', true],
  )
  const davi = await passwordFrom(hub, first)
  async function accept(invitationId: string, revision: number) {
    const response = await hub.app.inject({
      method: 'PUT',
      url: `/api/invitations/${invitationId}/acceptance`,
      headers: { ...ENTRY, cookie: davi },
      payload: JSON.stringify({ revision }),
    })
    assert.equal(response.statusCode, 200)
  }
  await accept(first, 1)
  const other = { ...BODY, cnpj: '11222333000181', legalName: 'Outra Ltda', name: 'Outra Empresa' }
  const second = Object((await post(hub, ana, '/api/clients', other)).json()).client
  const invited = Object((await received(hub, second.state.ownerInvitation.id, davi)).json())
  assert.deepEqual(
    [invited.invitation.kind, invited.invitation.inviterName, invited.invitation.role],
    ['INVITED', 'Conexus', 'owner'],
  )
  await accept(second.state.ownerInvitation.id, 0)
  const owned = Object((await companiesOf(hub, davi)).json()).companies
  assert.deepEqual(
    owned
      .map((one: { company: { id: string }; role: string }) => [one.company.id, one.role])
      .sort(),
    [
      [client.companyId, 'owner'],
      [second.companyId, 'owner'],
    ].sort(),
  )
  const listed = await hub.app.inject({
    method: 'GET',
    url: '/api/clients',
    headers: { cookie: ana.cookie },
  })
  const states = Object(listed.json()).clients.map(
    (one: { state: { kind: string } }) => one.state.kind,
  )
  assert.deepEqual([listed.statusCode, states], [200, ['ACTIVE', 'ACTIVE']])
  assert.deepEqual(Object((await companiesOf(hub, ana.cookie)).json()).companies, [])
  const read = await hub.app.inject({
    method: 'GET',
    url: `/api/companies/${client.companyId}`,
    headers: { cookie: ana.cookie },
  })
  assert.equal(read.statusCode, 404)
})

test('o endereço do administrador recusado pelo provedor: 201 com o cliente e mailBounced; o convite fica marcado e outro e-mail é convidado', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA)
  hub.mail.state.mode = 'BOUNCE'
  const response = await post(hub, ana, '/api/clients', BODY)
  const { client, mailBounced } = Object(response.json())
  assert.deepEqual(
    [response.statusCode, mailBounced, client.state.kind],
    [201, true, 'AWAITING_OWNER'],
  )
  const invitations = `/api/companies/${client.companyId}/invitations`
  const first = String(client.state.ownerInvitation.id)
  assert.deepEqual(
    await hub.test.asOwner('select mailed_at is not null as mailed from auth.invitation'),
    [{ mailed: true }],
  )
  hub.mail.state.mode = 'DELIVER'
  assert.equal((await manage(hub, ana, 'DELETE', `${invitations}/${first}`, 0)).statusCode, 204)
  const other = await post(hub, ana, invitations, { email: 'edu@example.test', role: 'owner' })
  assert.equal(other.statusCode, 201)
  // The bounced message reached the provider; the second e-mail is the new invitation's.
  assert.deepEqual(
    hub.mail.sent.map((sent) => sent.to),
    ['davi@example.test', 'edu@example.test'],
  )
})
