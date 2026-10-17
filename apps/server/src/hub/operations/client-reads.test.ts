import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import { ANA, BRUNO, CARLA, codeOf, hubWithMail, id, personOn, post } from '../identity/test-hub.ts'

const OWNER = { name: 'Davi Costa', email: 'davi@example.test' }
const BODY = {
  cnpj: '12.ABC.345/01DE-35',
  legalName: 'Empresa Teste Ltda',
  name: 'Empresa Teste',
  ownerEmail: OWNER.email,
}

function call(hub: Hub, person: Person, method: 'GET' | 'PUT', url: string, body?: object) {
  return hub.app.inject({
    method,
    url,
    headers: {
      origin: TEST_ORIGIN,
      cookie: person.cookie,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { payload: JSON.stringify(body) } : {}),
  })
}

async function registered(hub: Hub, ana: Person) {
  const response = await post(hub, ana, '/api/clients', BODY)
  assert.equal(response.statusCode, 201)
  return Object(response.json()).client
}

function correct(hub: Hub, ana: Person, companyId: string, changes: object) {
  const { ownerEmail: _, ...data } = BODY
  return call(hub, ana, 'PUT', `/api/clients/${companyId}`, { ...data, revision: 0, ...changes })
}

function accept(hub: Hub, person: Person, invitationId: string) {
  return call(hub, person, 'PUT', `/api/invitations/${invitationId}/acceptance`, { revision: 0 })
}

test('corrigir: aguardando dá 200 com a revisão +1 e o nome novo no convite; revisão velha, 412 CLIENT_STALE; CNPJ de outro, 409 CLIENT_EXISTS; ativo, 409 CLIENT_ACTIVE', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA)
  const client = await registered(hub, ana)
  const invitationId = client.state.ownerInvitation.id
  const changes = { cnpj: '11222333000181', legalName: 'Razão Corrigida', name: 'Nome Corrigido' }
  const corrected = await correct(hub, ana, client.companyId, changes)
  assert.equal(corrected.statusCode, 200)
  assert.deepEqual(Object(corrected.json()).client, { ...client, ...changes, revision: 1 })
  const view = await hub.app.inject({ method: 'GET', url: `/api/invitations/${invitationId}` })
  assert.equal(Object(view.json()).invitation.company.name, 'Nome Corrigido')
  const stale = await correct(hub, ana, client.companyId, { legalName: 'Outra' })
  assert.deepEqual([stale.statusCode, codeOf(stale)], [412, 'CLIENT_STALE'])
  const other = await post(hub, ana, '/api/clients', { ...BODY, ownerEmail: 'edu@example.test' })
  const taken = await correct(hub, ana, Object(other.json()).client.companyId, changes)
  assert.deepEqual([taken.statusCode, codeOf(taken)], [409, 'CLIENT_EXISTS'])
  const davi = await personOn(hub, OWNER)
  assert.equal((await accept(hub, davi, invitationId)).statusCode, 200)
  const active = await correct(hub, ana, client.companyId, { revision: 1 })
  assert.deepEqual([active.statusCode, codeOf(active)], [409, 'CLIENT_ACTIVE'])
  assert.deepEqual(
    await hub.test.asOwner(
      'select legal_name, revision from operations.client where company_id = $1',
      [client.companyId],
    ),
    [{ legal_name: 'Razão Corrigida', revision: 1 }],
  )
})

test('corrigir: contra o aceite, um vence sob o lock da empresa', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA)
  const davi = await personOn(hub, OWNER)
  const client = await registered(hub, ana)
  const [corrected, accepted] = await Promise.all([
    correct(hub, ana, client.companyId, { name: 'Nome Corrigido' }),
    accept(hub, davi, client.state.ownerInvitation.id),
  ])
  assert.equal(accepted.statusCode, 200)
  const [row] = await hub.test.asOwner('select name from auth.company')
  if (corrected.statusCode === 200) assert.deepEqual(row, { name: 'Nome Corrigido' })
  else {
    assert.deepEqual([corrected.statusCode, codeOf(corrected)], [409, 'CLIENT_ACTIVE'])
    assert.deepEqual(row, { name: 'Empresa Teste' })
  }
})

async function plant(hub: Hub, inviterId: string, index: number) {
  const companyId = id()
  const name = `Empresa ${String(index).padStart(2, '0')}`
  await hub.test.asOwner(
    `insert into auth.company (id, name, slug, created_at, attempt_key) values ($1, $2, $3, now(), $3)`,
    [companyId, name, randomUUID()],
  )
  await hub.test.asOwner(
    `insert into auth.invitation (id, company_id, email, role, status, expires_at, created_at,
      inviter_id, attempt_key) values ($1, $2, $3, 'owner', 'pending', now() + interval '1 day',
      now(), $4, $5)`,
    [id(), companyId, `dono${index}@example.test`, inviterId, randomUUID()],
  )
  const cnpj = `${String(index).padStart(12, '0')}00`
  await hub.test.asOwner(
    `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
      values ($1, $2, $3, $4, now() + make_interval(secs => $5))`,
    [companyId, cnpj, `${name} Ltda`, randomUUID(), index],
  )
  return companyId
}

test('ler: a lista pagina 50 por token; o ativo traz só os donos; empresa sem cliente não aparece e dá 404; id malformado, 404', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA)
  const bruno = await personOn(hub, BRUNO)
  const carla = await personOn(hub, CARLA)
  const ids: string[] = []
  for (let index = 0; index < 51; index++) ids.push(await plant(hub, ana.id, index))
  const activeId = ids[0] ?? ''
  for (const [person, role] of [
    [bruno, 'owner'],
    [carla, 'member'],
  ] as const) {
    await hub.test.asOwner(
      `insert into auth.member (id, company_id, user_id, role, created_at) values ($1, $2, $3, $4, now())`,
      [id(), activeId, person.id, role],
    )
  }
  const first = Object((await call(hub, ana, 'GET', '/api/clients')).json())
  assert.equal(first.clients.length, 50)
  assert.equal(first.clients[0].state.kind, 'ACTIVE')
  assert.equal(first.clients[0].state.owners, undefined)
  assert.equal(first.clients[1].state.ownerInvitation.email, 'dono1@example.test')
  const second = Object(
    (await call(hub, ana, 'GET', `/api/clients?page=${first.next.page}`)).json(),
  )
  assert.deepEqual(
    [second.clients.map((shown: { companyId: string }) => shown.companyId), second.next],
    [[ids[50]], { kind: 'END' }],
  )
  const detail = Object((await call(hub, ana, 'GET', `/api/clients/${activeId}`)).json()).client
  assert.deepEqual(detail.state.owners, [{ name: BRUNO.name, email: BRUNO.email }])
  assert.match(detail.state.activeSince, /^\d{4}-\d{2}-\d{2}T/)
  const loose = id()
  await hub.test.asOwner(
    `insert into auth.company (id, name, slug, created_at, attempt_key) values ($1, 'Solta', $2, now(), $2)`,
    [loose, randomUUID()],
  )
  for (const url of [`/api/clients/${loose}`, '/api/clients/nao-e-um-id']) {
    const missing = await call(hub, ana, 'GET', url)
    assert.deepEqual([missing.statusCode, codeOf(missing)], [404, 'NOT_FOUND'], url)
  }
  const malformed = await call(hub, ana, 'GET', '/api/clients?page=x')
  assert.deepEqual([malformed.statusCode, codeOf(malformed)], [400, 'REQUEST_MALFORMED'])
})
