import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import type { Hub, Person } from './test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  codeOf,
  hubOn,
  id,
  personOn,
  plantCompany,
  post,
} from './test-hub.ts'

const CARLA_OPERATOR = { ...CARLA, role: 'admin' }

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

async function join(hub: Hub, companyId: string, personId: string, role: string) {
  await hub.test.asOwner(
    `insert into auth.member (id, company_id, user_id, role, created_at)
      values ($1, $2, $3, $4, now())`,
    [id(), companyId, personId, role],
  )
}

test('fora: o membro lê a empresa e as pessoas; os convites, só dono e administrador; outra empresa, id desconhecido ou malformado, o mesmo 404', async (t) => {
  const hub = await hubOn(t)
  const ana = await personOn(hub, ANA_OWNER)
  const bruno = await personOn(hub, BRUNO)
  const carla = await personOn(hub, CARLA)
  const companyId = await plantCompany(hub.test, ana.id, 'Empresa Teste')
  await plantCompany(hub.test, ana.id, 'Outra Empresa')
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
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id, 'Empresa Teste')
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
  for (const page of ['x', members.members[1].personId]) {
    const malformed = await call(
      hub,
      ana,
      'GET',
      `/api/companies/${companyId}/members?page=${page}`,
    )
    assert.deepEqual([malformed.statusCode, codeOf(malformed)], [400, 'REQUEST_MALFORMED'], page)
  }
})

test('fora: um convite vencido fica em "Convites pendentes", marcado EXPIRED pelo relógio do banco', async (t) => {
  const hub = await hubOn(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id, 'Empresa Teste')
  const seeded = [
    ['viva@example.test', "now() + interval '1 day'", 1],
    ['vencida@example.test', "now() - interval '1 hour'", 2],
  ] as const
  for (const [email, expires, second] of seeded) {
    await hub.test.asOwner(
      `insert into auth.invitation (id, company_id, email, role, status, expires_at, created_at,
        inviter_id, attempt_key) values ($1, $2, $3, 'member', 'pending', ${expires},
        now() + make_interval(secs => $4), $5, $6)`,
      [id(), companyId, email, second, ana.id, randomUUID()],
    )
  }
  const response = await call(hub, ana, 'GET', `/api/companies/${companyId}/invitations`)
  assert.equal(response.statusCode, 200)
  const page = Object(response.json())
  assert.deepEqual(
    page.invitations.map((row: { email: string; state: string }) => [row.email, row.state]),
    [
      ['viva@example.test', 'PENDING'],
      ['vencida@example.test', 'EXPIRED'],
    ],
  )
  assert.deepEqual(page.next, { kind: 'END' })
})

test('lista: só as empresas de quem pede, com o papel, 50 por página; mayOperate só do operador, que não é membro de nenhuma; a página de uma empresa alheia não abre nada', async (t) => {
  const hub = await hubOn(t)
  const ana = await personOn(hub, ANA_OWNER)
  const bruno = await personOn(hub, BRUNO)
  const ids: string[] = []
  for (let index = 0; index < 51; index++) {
    ids.push(await plantCompany(hub.test, ana.id, `Empresa ${String(index).padStart(2, '0')}`))
  }
  await join(hub, ids[3] ?? '', bruno.id, 'admin')
  const first = Object((await call(hub, ana, 'GET', '/api/companies')).json())
  assert.equal(first.companies.length, 50)
  assert.deepEqual(first.companies[0], {
    company: { id: ids[0], name: 'Empresa 00' },
    role: 'owner',
  })
  assert.equal(first.mayOperate, false)
  const second = Object(
    (await call(hub, ana, 'GET', `/api/companies?page=${first.next.page}`)).json(),
  )
  assert.deepEqual(second, {
    companies: [{ company: { id: ids[50], name: 'Empresa 50' }, role: 'owner' }],
    mayOperate: false,
    next: { kind: 'END' },
  })
  assert.deepEqual((await call(hub, bruno, 'GET', '/api/companies')).json(), {
    companies: [{ company: { id: ids[3], name: 'Empresa 03' }, role: 'admin' }],
    mayOperate: false,
    next: { kind: 'END' },
  })
  const operator = await personOn(hub, CARLA_OPERATOR)
  assert.deepEqual((await call(hub, operator, 'GET', '/api/companies')).json(), {
    companies: [],
    mayOperate: true,
    next: { kind: 'END' },
  })
  const foreign = Buffer.from(ids[0] ?? '').toString('base64url')
  assert.deepEqual((await call(hub, bruno, 'GET', `/api/companies?page=${foreign}`)).json(), {
    companies: [],
    mayOperate: false,
    next: { kind: 'END' },
  })
})

test('fora: o operador não lê empresa alguma, ativa ou sem membro: getCompany, listMembers e listInvitations dão 404, sem motivo na resposta; só o operador convida numa empresa sem membro, e não numa ativa', async (t) => {
  const hub = await hubOn(t)
  const operator = await personOn(hub, CARLA_OPERATOR)
  const bruno = await personOn(hub, BRUNO)
  const active = id()
  const awaiting = id()
  for (const [companyId, name] of [
    [active, 'Empresa Ativa'],
    [awaiting, 'Empresa Sem Membro'],
  ] as const) {
    await hub.test.asOwner(
      `insert into auth.company (id, name, slug, created_at, attempt_key)
        values ($1, $2, $3, now(), $3)`,
      [companyId, name, randomUUID()],
    )
  }
  await join(hub, active, bruno.id, 'owner')
  for (const companyId of [active, awaiting]) {
    for (const path of ['', '/members', '/invitations']) {
      const response = await call(hub, operator, 'GET', `/api/companies/${companyId}${path}`)
      assert.equal(response.statusCode, 404, path)
      const { traceId: _, ...shown } = Object(response.json())
      assert.deepEqual(shown, {
        type: 'urn:conexus:problem:NOT_FOUND',
        title: 'Não encontramos o que você procurou.',
        status: 404,
        code: 'NOT_FOUND',
      })
    }
  }
  assert.equal((await call(hub, bruno, 'GET', `/api/companies/${active}`)).statusCode, 200)
  const invite = { email: 'davi@example.test', role: 'owner' }
  for (const [person, companyId] of [
    [bruno, awaiting],
    [operator, active],
  ] as const) {
    const refused = await post(hub, person, `/api/companies/${companyId}/invitations`, invite)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  }
  assert.deepEqual(
    await hub.test.asOwner('select count(*)::int as invitations from auth.invitation'),
    [{ invitations: 0 }],
  )
})

test('criar: POST /api/companies não existe mais, 404, e nenhuma empresa nasce', async (t) => {
  const hub = await hubOn(t)
  const operator = await personOn(hub, CARLA_OPERATOR)
  const response = await post(hub, operator, '/api/companies', { name: 'Empresa Nova' })
  assert.equal(response.statusCode, 404)
  assert.deepEqual(await hub.test.asOwner('select count(*)::int as companies from auth.company'), [
    { companies: 0 },
  ])
})
