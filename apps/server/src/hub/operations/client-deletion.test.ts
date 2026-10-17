import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import {
  serveEnvironment,
  spawnHub,
  TEST_ORIGIN,
  WRITE_HEADERS,
} from '../../platform/test-database.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import {
  ANA,
  BRUNO,
  codeOf,
  hubWithMail,
  PASSWORD,
  personOn,
  post,
  signIn,
} from '../identity/test-hub.ts'

const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }
const EDU = { name: 'Edu Lima', email: 'edu@example.test' }
const BODY_A = {
  cnpj: '12.ABC.345/01DE-35',
  legalName: 'Empresa A Ltda',
  name: 'Empresa A',
  ownerEmail: DAVI.email,
}
const BODY_B = {
  cnpj: '11.222.333/0001-81',
  legalName: 'Empresa B Ltda',
  name: 'Empresa B',
  ownerEmail: EDU.email,
}

type Method = 'GET' | 'PUT' | 'DELETE'

function call(hub: Hub, person: Person, method: Method, url: string, body?: object) {
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

function remove(hub: Hub, person: Person, companyId: string, body: object) {
  return call(hub, person, 'DELETE', `/api/clients/${companyId}`, body)
}

async function register(hub: Hub, ana: Person, body: object) {
  const response = await post(hub, ana, '/api/clients', body)
  assert.equal(response.statusCode, 201)
  return Object(response.json()).client
}

function accept(hub: Hub, person: Person, invitationId: string) {
  return call(hub, person, 'PUT', `/api/invitations/${invitationId}/acceptance`, { revision: 0 })
}

/** Two clients of Ana, the operator: A owned by Davi, B by Edu, both active. */
async function twoClients(t: TestContext) {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA)
  const davi = await personOn(hub, DAVI)
  const edu = await personOn(hub, EDU)
  const a = await register(hub, ana, BODY_A)
  const b = await register(hub, ana, BODY_B)
  assert.equal((await accept(hub, davi, a.state.ownerInvitation.id)).statusCode, 200)
  assert.equal((await accept(hub, edu, b.state.ownerInvitation.id)).statusCode, 200)
  return { hub, ana, davi, edu, a, b }
}

/** The rows of one company, by table, as the owner sees them. */
async function rowsOf(hub: Hub, companyId: string) {
  const [row] = await hub.test.asOwner(
    `select
      (select count(*)::int from auth.company where id = $1) as companies,
      (select count(*)::int from auth.member where company_id = $1) as members,
      (select count(*)::int from auth.invitation where company_id = $1) as invitations,
      (select count(*)::int from operations.client where company_id = $1) as clients`,
    [companyId],
  )
  return row
}

async function people(hub: Hub) {
  return hub.test.asOwner(`select
    (select count(*)::int from auth.user) as people,
    (select count(*)::int from auth.account) as accounts,
    (select count(*)::int from auth.session) as sessions`)
}

const GONE = { companies: 0, members: 0, invitations: 0, clients: 0 }
const ACTIVE = { companies: 1, members: 1, invitations: 1, clients: 1 }

test('apagar: nome e revisão certos dão 204; saem empresa, membros, convites e cadastro; pessoas, contas, sessões e a empresa B ficam', async (t) => {
  const { hub, ana, davi, a, b } = await twoClients(t)
  const before = await people(hub)
  const deleted = await remove(hub, ana, a.companyId, { name: 'Empresa A', revision: 0 })
  assert.deepEqual([deleted.statusCode, deleted.body], [204, ''])
  assert.deepEqual(await rowsOf(hub, a.companyId), GONE)
  assert.deepEqual(await rowsOf(hub, b.companyId), ACTIVE)
  assert.deepEqual(await people(hub), before)
  const company = await call(hub, davi, 'GET', `/api/companies/${a.companyId}`)
  assert.deepEqual([company.statusCode, codeOf(company)], [404, 'NOT_FOUND'])
  const listed = await call(hub, davi, 'GET', '/api/companies')
  assert.deepEqual(Object(listed.json()).companies, [])
  const link = await hub.app.inject({ url: `/api/invitations/${a.state.ownerInvitation.id}` })
  assert.deepEqual([link.statusCode, codeOf(link)], [404, 'NOT_FOUND'])
  const again = await signIn(hub, { email: DAVI.email, password: PASSWORD })
  assert.equal(again.statusCode, 200)
  const reused = await post(hub, ana, '/api/clients', {
    ...BODY_A,
    ownerEmail: 'fabi@example.test',
  })
  assert.equal(reused.statusCode, 201)
})

test('apagar: fora, quem não é operador, o dono incluído, recebe 404 e nada sai', async (t) => {
  const { hub, davi, a } = await twoClients(t)
  const bruno = await personOn(hub, BRUNO)
  for (const person of [bruno, davi]) {
    const refused = await remove(hub, person, a.companyId, { name: 'Empresa A', revision: 0 })
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  }
  assert.deepEqual(await rowsOf(hub, a.companyId), ACTIVE)
})

test('apagar: recusas, revisão velha 412, nome diferente 422, repetido 404 igual ao desconhecido, recusa plantada nada tira', async (t) => {
  const { hub, ana, a } = await twoClients(t)
  const stale = await remove(hub, ana, a.companyId, { name: 'Empresa A', revision: 1 })
  assert.deepEqual([stale.statusCode, codeOf(stale)], [412, 'CLIENT_STALE'])
  for (const name of ['empresa a', 'Empresa A ', 'Empresa A Ltda', '']) {
    const mismatch = await remove(hub, ana, a.companyId, { name, revision: 0 })
    assert.deepEqual([mismatch.statusCode, codeOf(mismatch)], [422, 'CLIENT_NAME_MISMATCH'], name)
  }
  assert.deepEqual(await rowsOf(hub, a.companyId), ACTIVE)
  await hub.test.asOwner(`create function public.refuse_write() returns trigger
    language plpgsql as $$ begin raise exception 'refused'; end $$`)
  for (const table of ['operations.client', 'auth.member', 'auth.invitation', 'auth.company']) {
    await hub.test.asOwner(`create trigger refuse_write after delete on ${table}
      for each row execute function public.refuse_write()`)
    const refused = await remove(hub, ana, a.companyId, { name: 'Empresa A', revision: 0 })
    assert.deepEqual([refused.statusCode, codeOf(refused)], [500, 'INTERNAL_UNEXPECTED'], table)
    await hub.test.asOwner(`drop trigger refuse_write on ${table}`)
    assert.deepEqual(await rowsOf(hub, a.companyId), ACTIVE, table)
  }
  assert.equal(
    (await remove(hub, ana, a.companyId, { name: 'Empresa A', revision: 0 })).statusCode,
    204,
  )
  const repeated = await remove(hub, ana, a.companyId, { name: 'Empresa A', revision: 0 })
  const unknown = await remove(hub, ana, 'A'.repeat(32), { name: 'Empresa A', revision: 0 })
  const { traceId: _r, ...first } = Object(repeated.json())
  const { traceId: _u, ...second } = Object(unknown.json())
  assert.deepEqual([repeated.statusCode, unknown.statusCode, first.code], [404, 404, 'NOT_FOUND'])
  assert.deepEqual(first, second)
})

test('apagar: concorrência, contra aceite, reenvio, correção e outro apagar, um vence pelo lock e nada volta', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA)
  const davi = await personOn(hub, DAVI)
  const awaiting = await register(hub, ana, BODY_A)
  const invitation = awaiting.state.ownerInvitation.id
  const body = { name: 'Empresa A', revision: 0 }
  const [deleted, accepted] = await Promise.all([
    remove(hub, ana, awaiting.companyId, body),
    accept(hub, davi, invitation),
  ])
  assert.equal(deleted.statusCode, 204)
  // The accept that waited on the lock finds its invitation gone and answers 4.1's closed link.
  assert.ok([200, 404, 422].includes(accepted.statusCode), String(accepted.statusCode))
  assert.deepEqual(await rowsOf(hub, awaiting.companyId), GONE)
  const link = await call(hub, davi, 'GET', `/api/invitations/${invitation}`)
  assert.deepEqual([link.statusCode, codeOf(link)], [404, 'NOT_FOUND'])
  const renewing = await register(hub, ana, BODY_B)
  const url = `/api/companies/${renewing.companyId}/invitations/${renewing.state.ownerInvitation.id}`
  const [removed, renewed] = await Promise.all([
    remove(hub, ana, renewing.companyId, { name: 'Empresa B', revision: 0 }),
    call(hub, ana, 'PUT', url, { revision: 0 }),
  ])
  assert.equal(removed.statusCode, 204)
  assert.ok([200, 404].includes(renewed.statusCode), String(renewed.statusCode))
  assert.deepEqual(await rowsOf(hub, renewing.companyId), GONE)
  const corrected = await register(hub, ana, { ...BODY_A, ownerEmail: 'gil@example.test' })
  const correctionBody = { ...BODY_A, ownerEmail: 'gil@example.test', revision: 0 }
  const [gone, correction] = await Promise.all([
    remove(hub, ana, corrected.companyId, body),
    call(hub, ana, 'PUT', `/api/clients/${corrected.companyId}`, correctionBody),
  ])
  // Either the delete wins and the correction finds nothing, or the correction moves the revision.
  const outcome = `${gone.statusCode} ${correction.statusCode}`
  assert.ok(['204 404', '412 200'].includes(outcome), outcome)
  const twice = await register(hub, ana, { ...BODY_B, ownerEmail: 'hugo@example.test' })
  const both = await Promise.all([
    remove(hub, ana, twice.companyId, { name: 'Empresa B', revision: 0 }),
    remove(hub, ana, twice.companyId, { name: 'Empresa B', revision: 0 }),
  ])
  assert.deepEqual(both.map((response) => response.statusCode).sort(), [204, 404])
  assert.deepEqual(await rowsOf(hub, twice.companyId), GONE)
  const orphans = await hub.test.asOwner(`select count(*)::int as orphans from auth.member m
    where not exists (select 1 from auth.company c where c.id = m.company_id)`)
  assert.deepEqual(orphans, [{ orphans: 0 }])
})

test('log: CLIENT_DELETED leva o trace e os ids, nunca o nome, o CNPJ ou o e-mail', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA)
  const awaiting = await register(hub, ana, BODY_A)
  const environment = {
    ...serveEnvironment(t, hub.test.runtimeUrl),
    HUB_MAIL_API_URL: hub.mail.url,
  }
  const { port, lines, stop } = await spawnHub(t, environment)
  const base = `http://127.0.0.1:${port}`
  const json = { origin: TEST_ORIGIN, 'content-type': 'application/json' }
  try {
    const signedIn = await fetch(`${base}/api/sessions/current`, {
      method: 'PUT',
      headers: { ...json, 'cf-connecting-ip': '203.0.113.9' },
      body: JSON.stringify({ email: ANA.email, password: PASSWORD }),
    })
    const cookie = (signedIn.headers.get('set-cookie') ?? '').split(';')[0] ?? ''
    const deleted = await fetch(`${base}/api/clients/${awaiting.companyId}`, {
      method: 'DELETE',
      headers: { ...json, cookie },
      body: JSON.stringify({ name: 'Empresa A', revision: 0 }),
    })
    assert.equal(deleted.status, 204)
    const line = lines.find((logged) => logged.msg === 'CLIENT_DELETED')
    assert.equal(line?.companyId, awaiting.companyId)
    assert.equal(line?.personId, ana.id)
    assert.match(String(line?.traceId), /^[0-9a-f-]{36}$/)
  } finally {
    await stop()
  }
  const output = JSON.stringify(lines)
  for (const kept of ['12ABC34501DE35', 'Empresa A', DAVI.email, ANA.email]) {
    assert.doesNotMatch(output, new RegExp(kept))
  }
})

test('apagar: concorrência com o link, senha e recusa que esperavam o lock dão 404, nunca 500', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA)
  const actions = {
    password: { name: 'Davi Costa', password: 'senha-nova-1', revision: 0 },
    declination: { revision: 0 },
  }
  let round = 0
  for (const [action, payload] of Object.entries(actions)) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      round += 1
      const owner = `dono${round}@example.test`
      const cnpj = ['11.222.333/0001-81', '45.997.418/0001-53', '12.ABC.345/01DE-35'][attempt]
      const client = await register(hub, ana, { ...BODY_A, cnpj, ownerEmail: owner })
      const [deleted, answered] = await Promise.all([
        remove(hub, ana, client.companyId, { name: 'Empresa A', revision: 0 }),
        hub.app.inject({
          method: 'PUT',
          url: `/api/invitations/${client.state.ownerInvitation.id}/${action}`,
          headers: WRITE_HEADERS,
          payload,
        }),
      ])
      assert.equal(deleted.statusCode, 204)
      assert.ok([200, 204, 404].includes(answered.statusCode), `${action} ${answered.statusCode}`)
      assert.deepEqual(await rowsOf(hub, client.companyId), GONE)
    }
  }
})
