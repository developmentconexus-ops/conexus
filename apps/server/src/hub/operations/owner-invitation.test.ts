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

test('empresa ativa: o operador recebe 404 ao convidar, reenviar e cancelar', async (t) => {
  const { hub, ana, invitations, first } = await awaiting(t)
  const davi = await personOn(hub, OWNER)
  const accepted = await hub.app.inject({
    method: 'PUT',
    url: `/api/invitations/${first}/acceptance`,
    headers: { origin: TEST_ORIGIN, cookie: davi.cookie, 'content-type': 'application/json' },
    payload: JSON.stringify({ revision: 0 }),
  })
  assert.equal(accepted.statusCode, 200)
  const refused = [
    await post(hub, ana, invitations, { email: 'edu@example.test', role: 'owner' }),
    await manage(hub, ana, 'PUT', `${invitations}/${first}`, 1),
    await manage(hub, ana, 'DELETE', `${invitations}/${first}`, 1),
  ]
  for (const response of refused) {
    assert.deepEqual([response.statusCode, codeOf(response)], [404, 'NOT_FOUND'])
  }
  assert.deepEqual(await hub.test.asOwner('select user_id, role from auth.member'), [
    { user_id: davi.id, role: 'owner' },
  ])
})
