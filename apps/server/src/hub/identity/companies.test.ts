import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { hashPassword } from 'better-auth/crypto'
import { createHub, identityOf } from '../../main.ts'
import { createTestDatabase, TEST_ORIGIN, testConfig } from '../../platform/test-database.ts'
import { createStatus } from '../status/public.ts'

const silent = { info: () => undefined, error: () => undefined }
const PASSWORD = 'senha-certa-1'
const ADMIN = { name: 'Ana Lima', email: 'ana@example.test', role: 'admin' }
const BRUNO = { name: 'Bruno Reis', email: 'bruno@example.test' }
const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }

async function hubOn(t: TestContext) {
  const test = await createTestDatabase(t)
  const config = testConfig(test.runtimeUrl)
  const status = createStatus({ version: config.version, database: test.database })
  const identity = identityOf({ database: test.database, config, log: silent })
  const app = await createHub(config, { status, identity })
  t.after(() => app.close())
  return { app, test }
}

type Hub = Awaited<ReturnType<typeof hubOn>>
type Who = { name: string; email: string; role?: string }

function id(): string {
  return randomBytes(16).toString('hex')
}

async function personOn(hub: Hub, who: Who) {
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

function call(
  hub: Hub,
  person: Person | undefined,
  method: 'GET' | 'POST',
  url: string,
  more = {},
) {
  return hub.app.inject({
    method,
    url,
    headers: { origin: TEST_ORIGIN, ...(person ? { cookie: person.cookie } : {}), ...more },
  })
}

function create(hub: Hub, person: Person, name: string, key: string = randomUUID()) {
  return hub.app.inject({
    method: 'POST',
    url: '/api/companies',
    headers: {
      origin: TEST_ORIGIN,
      'content-type': 'application/json',
      'idempotency-key': key,
      cookie: person.cookie,
    },
    payload: JSON.stringify({ name }),
  })
}

async function companyOf(hub: Hub, person: Person, name: string): Promise<string> {
  const response = await create(hub, person, name)
  assert.equal(response.statusCode, 201)
  return String(Object(response.json()).company.id)
}

async function join(hub: Hub, companyId: string, personId: string, role: string) {
  await hub.test.asOwner(
    `insert into auth.member (id, company_id, user_id, role, created_at)
      values ($1, $2, $3, $4, now())`,
    [id(), companyId, personId, role],
  )
}

function codeOf(response: { json(): unknown }): unknown {
  return Object(response.json()).code
}

test('criar: o administrador cria, 201, e é o dono; a mesma chave dá a mesma empresa, também duas juntas', async (t) => {
  const hub = await hubOn(t)
  const ana = await personOn(hub, ADMIN)
  const created = await create(hub, ana, '  Empresa Teste ')
  assert.equal(created.statusCode, 201)
  const { company } = Object(created.json())
  assert.deepEqual(Object.keys(company).sort(), ['id', 'name'])
  assert.equal(company.name, 'Empresa Teste')
  assert.match(company.id, /^[A-Za-z0-9]{32}$/)
  assert.deepEqual(
    await hub.test.asOwner('select user_id, role from auth.member where company_id = $1', [
      company.id,
    ]),
    [{ user_id: ana.id, role: 'owner' }],
  )
  const key = randomUUID()
  const twice = await Promise.all([
    create(hub, ana, 'Outra Empresa', key),
    create(hub, ana, 'Outra Empresa', key),
  ])
  const again = await create(hub, ana, 'Outra Empresa', key)
  const answers = [...twice, again].map((response) => [response.statusCode, response.body])
  assert.deepEqual(
    answers.map(([status]) => status),
    [201, 201, 201],
  )
  assert.equal(new Set(answers.map(([, body]) => body)).size, 1)
  assert.deepEqual(await hub.test.asOwner('select count(*)::int as companies from auth.company'), [
    { companies: 2 },
  ])
})

test('criar: a mesma chave com outro nome, 409 IDEMPOTENCY_CONFLICT; sem chave, 400', async (t) => {
  const hub = await hubOn(t)
  const ana = await personOn(hub, ADMIN)
  const key = randomUUID()
  assert.equal((await create(hub, ana, 'Empresa Teste', key)).statusCode, 201)
  const conflict = await create(hub, ana, 'Empresa Nova', key)
  assert.deepEqual([conflict.statusCode, codeOf(conflict)], [409, 'IDEMPOTENCY_CONFLICT'])
  const keyless = await create(hub, ana, 'Empresa Nova', 'chave')
  assert.deepEqual([keyless.statusCode, codeOf(keyless)], [400, 'REQUEST_MALFORMED'])
  assert.deepEqual(await hub.test.asOwner('select name from auth.company'), [
    { name: 'Empresa Teste' },
  ])
})

test('criar: outra pessoa, 404 NOT_FOUND e nenhuma empresa, com chave nova ou com a chave de outra', async (t) => {
  const hub = await hubOn(t)
  const ana = await personOn(hub, ADMIN)
  const bruno = await personOn(hub, BRUNO)
  const key = randomUUID()
  assert.equal((await create(hub, ana, 'Empresa Teste', key)).statusCode, 201)
  for (const refused of [
    await create(hub, bruno, 'Empresa Nova'),
    await create(hub, bruno, 'Empresa Teste', key),
  ]) {
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  }
  assert.deepEqual(await hub.test.asOwner('select count(*)::int as companies from auth.company'), [
    { companies: 1 },
  ])
})

test('fora: o membro lê a empresa e as pessoas; os convites, só dono e administrador; outra empresa, id desconhecido ou malformado, o mesmo 404', async (t) => {
  const hub = await hubOn(t)
  const ana = await personOn(hub, ADMIN)
  const bruno = await personOn(hub, BRUNO)
  const carla = await personOn(hub, CARLA)
  const companyId = await companyOf(hub, ana, 'Empresa Teste')
  await companyOf(hub, ana, 'Outra Empresa')
  await join(hub, companyId, bruno.id, 'member')
  const read = await call(hub, bruno, 'GET', `/api/companies/${companyId}`)
  assert.equal(read.statusCode, 200)
  assert.deepEqual(read.json(), {
    company: { id: companyId, name: 'Empresa Teste' },
    role: 'member',
    mayInviteAs: [],
  })
  const owner = await call(hub, ana, 'GET', `/api/companies/${companyId}`)
  assert.deepEqual(Object(owner.json()).mayInviteAs, ['owner', 'admin', 'member'])
  const members = await call(hub, bruno, 'GET', `/api/companies/${companyId}/members`)
  assert.deepEqual(members.json(), {
    members: [
      { personId: ana.id, name: 'Ana Lima', email: 'ana@example.test', role: 'owner' },
      { personId: bruno.id, name: 'Bruno Reis', email: 'bruno@example.test', role: 'member' },
    ],
    next: { kind: 'END' },
  })
  const invitations = await call(hub, ana, 'GET', `/api/companies/${companyId}/invitations`)
  assert.deepEqual(invitations.json(), { invitations: [], next: { kind: 'END' } })
  await hub.test.asOwner(`update auth.member set role = 'admin' where user_id = $1`, [bruno.id])
  const asAdmin = await call(hub, bruno, 'GET', `/api/companies/${companyId}`)
  assert.deepEqual(Object(asAdmin.json()).mayInviteAs, ['admin', 'member'])
  assert.equal(
    (await call(hub, bruno, 'GET', `/api/companies/${companyId}/invitations`)).statusCode,
    200,
  )
  await hub.test.asOwner(`update auth.member set role = 'member' where user_id = $1`, [bruno.id])
  const refused = [
    await call(hub, bruno, 'GET', `/api/companies/${companyId}/invitations`),
    await call(hub, carla, 'GET', `/api/companies/${companyId}`),
    await call(hub, carla, 'GET', `/api/companies/${companyId}/members`),
    await call(hub, carla, 'GET', `/api/companies/${companyId}/invitations`),
    await call(hub, bruno, 'GET', `/api/companies/${id()}`),
    await call(hub, bruno, 'GET', '/api/companies/nao-e-um-id'),
  ]
  const expected = { title: 'Não encontramos o que você procurou.', status: 404, code: 'NOT_FOUND' }
  for (const response of refused) {
    assert.equal(response.statusCode, 404)
    const { title, status, code } = Object(response.json())
    assert.deepEqual({ title, status, code }, expected)
  }
  assert.equal((await call(hub, undefined, 'GET', `/api/companies/${companyId}`)).statusCode, 401)
})

test('fora: a segunda página de pessoas e de convites vem por next', async (t) => {
  const hub = await hubOn(t)
  const ana = await personOn(hub, ADMIN)
  const companyId = await companyOf(hub, ana, 'Empresa Teste')
  for (let index = 0; index < 51; index++) {
    const personId = id()
    const name = `Pessoa ${String(index).padStart(2, '0')}`
    await hub.test.asOwner('insert into auth.user (id, name, email) values ($1, $2, $3)', [
      personId,
      name,
      `pessoa${index}@example.test`,
    ])
    await join(hub, companyId, personId, 'member')
    await hub.test.asOwner(
      `insert into auth.invitation (id, company_id, email, role, status, expires_at, created_at,
        inviter_id, attempt_key) values ($1, $2, $3, 'member', 'pending', now() + interval '1 day',
        now() + make_interval(secs => $4), $5, $6)`,
      [id(), companyId, `convite${index}@example.test`, index, ana.id, randomUUID()],
    )
  }
  for (const list of ['members', 'invitations']) {
    const first = await call(hub, ana, 'GET', `/api/companies/${companyId}/${list}`)
    const page = Object(first.json())
    assert.equal(page[list].length, 50)
    assert.equal(page.next.kind, 'MORE')
    const second = await call(
      hub,
      ana,
      'GET',
      `/api/companies/${companyId}/${list}?page=${page.next.page}`,
    )
    const rest = Object(second.json())
    assert.equal(rest[list].length, list === 'members' ? 2 : 1)
    assert.deepEqual(rest.next, { kind: 'END' })
  }
  const members = Object(
    (await call(hub, ana, 'GET', `/api/companies/${companyId}/members`)).json(),
  )
  assert.equal(members.members[0].name, 'Ana Lima')
  const malformed = await call(hub, ana, 'GET', `/api/companies/${companyId}/members?page=x`)
  assert.deepEqual([malformed.statusCode, codeOf(malformed)], [400, 'REQUEST_MALFORMED'])
})

test('lista: só as empresas de quem pede, com o papel, 50 por página; mayCreate só do administrador', async (t) => {
  const hub = await hubOn(t)
  const ana = await personOn(hub, ADMIN)
  const bruno = await personOn(hub, BRUNO)
  const ids: string[] = []
  // Seeded rows: through the API, the plugin reads an owner's companies at once on one connection.
  for (let index = 0; index < 51; index++) {
    const companyId = id()
    await hub.test.asOwner(
      `insert into auth.company (id, name, slug, created_at, attempt_key)
        values ($1, $2, $3, now(), $3)`,
      [companyId, `Empresa ${String(index).padStart(2, '0')}`, randomUUID()],
    )
    await join(hub, companyId, ana.id, 'owner')
    ids.push(companyId)
  }
  await join(hub, ids[3] ?? '', bruno.id, 'admin')
  const first = Object((await call(hub, ana, 'GET', '/api/companies')).json())
  assert.equal(first.companies.length, 50)
  assert.deepEqual(first.companies[0], {
    company: { id: ids[0], name: 'Empresa 00' },
    role: 'owner',
  })
  assert.equal(first.mayCreate, true)
  const second = Object(
    (await call(hub, ana, 'GET', `/api/companies?page=${first.next.page}`)).json(),
  )
  assert.deepEqual(second, {
    companies: [{ company: { id: ids[50], name: 'Empresa 50' }, role: 'owner' }],
    mayCreate: true,
    next: { kind: 'END' },
  })
  assert.deepEqual((await call(hub, bruno, 'GET', '/api/companies')).json(), {
    companies: [{ company: { id: ids[3], name: 'Empresa 03' }, role: 'admin' }],
    mayCreate: false,
    next: { kind: 'END' },
  })
})
