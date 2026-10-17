import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { Member, Role } from '@conexus/hub-api'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import type { Hub, Person } from './test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  codeOf,
  hubWithMail,
  id,
  personOn,
  plantCompany,
  post,
} from './test-hub.ts'

const NAMES = {
  gil: { name: 'Gil Matos', email: 'gil@example.test' },
  davi: { name: 'Davi Costa', email: 'davi@example.test' },
  edu: { name: 'Edu Lima', email: 'edu@example.test' },
  fabi: { name: 'Fabi Reis', email: 'fabi@example.test' },
  central: { name: 'Central Conexus', email: 'central@example.test', role: 'admin' },
}

const SEATED = ['ana', 'gil', 'bruno', 'carla', 'davi', 'edu'] as const
type Name = (typeof SEATED)[number]
type Roster = Partial<Record<Name, Role>>
/** Two owners, two administrators, two members. */
const FULL: Roster = {
  ana: 'owner',
  gil: 'owner',
  bruno: 'admin',
  carla: 'admin',
  davi: 'member',
  edu: 'member',
}

/** A company of six people, an outsider and the Central's operator, each signed in. */
async function world(t: TestContext) {
  const hub = await hubWithMail(t)
  const people = {
    ana: await personOn(hub, ANA_OWNER),
    gil: await personOn(hub, NAMES.gil),
    bruno: await personOn(hub, BRUNO),
    carla: await personOn(hub, CARLA),
    davi: await personOn(hub, NAMES.davi),
    edu: await personOn(hub, NAMES.edu),
    fabi: await personOn(hub, NAMES.fabi),
    central: await personOn(hub, NAMES.central),
  }
  const companyId = await plantCompany(hub.test, people.ana.id)
  async function seat(roster: Roster = FULL) {
    await hub.test.asOwner('delete from auth.member where company_id = $1', [companyId])
    for (const name of SEATED) {
      const role = roster[name]
      if (role === undefined) continue
      await hub.test.asOwner(
        `insert into auth.member (id, company_id, user_id, role, created_at)
          values ($1, $2, $3, $4, now())`,
        [id(), companyId, people[name].id, role],
      )
    }
  }
  await seat()
  const base = `/api/companies/${companyId}`
  return { hub, people, companyId, seat, base }
}
type World = Awaited<ReturnType<typeof world>>

function act(
  hub: Hub,
  person: Person,
  method: 'GET' | 'PUT' | 'DELETE',
  url: string,
  body?: unknown,
) {
  return hub.app.inject({
    method,
    url,
    headers: {
      origin: TEST_ORIGIN,
      cookie: person.cookie,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(body === undefined ? {} : { payload: JSON.stringify(body) }),
  })
}

function remove(w: World, actor: Person, target: Person, companyId = w.companyId) {
  return act(w.hub, actor, 'DELETE', `/api/companies/${companyId}/members/${target.id}`)
}

function change(w: World, actor: Person, target: Person, role: Role, from: Role) {
  return act(w.hub, actor, 'PUT', `${w.base}/members/${target.id}`, { role, from })
}

async function rolesOf(w: World): Promise<Record<string, unknown>> {
  const rows = await w.hub.test.asOwner(
    `select u.email, m.role from auth.member m join auth."user" u on u.id = m.user_id
      where m.company_id = $1 order by u.email`,
    [w.companyId],
  )
  return Object.fromEntries(rows.map((row) => [String(row.email).split('@')[0], row.role]))
}

test('quem tira quem: o dono tira qualquer um, o administrador só administrador e membro, o membro só a si; quem não é da empresa, 404; a tirada lê a empresa: 404', async (t) => {
  const w = await world(t)
  const { ana, gil, bruno, carla, davi, edu, fabi } = w.people
  const cases: [Person, Person, number][] = [
    [ana, gil, 204],
    [ana, bruno, 204],
    [ana, davi, 204],
    [gil, ana, 204],
    [bruno, carla, 204],
    [bruno, davi, 204],
    [bruno, ana, 404],
    [bruno, gil, 404],
    [davi, edu, 404],
    [davi, ana, 404],
    [davi, davi, 204],
    [bruno, bruno, 204],
    [ana, ana, 204],
    [fabi, davi, 404],
    [fabi, fabi, 404],
    [ana, fabi, 204],
  ]
  for (const [actor, target, status] of cases) {
    await w.seat()
    const response = await remove(w, actor, target)
    assert.equal(response.statusCode, status, `${actor.id} → ${target.id}`)
    if (status === 404) assert.equal(codeOf(response), 'NOT_FOUND')
    if (status === 204) assert.equal(response.body, '')
  }
  // A person who was taken out meets the same not-found as an outsider, at once.
  await w.seat()
  assert.equal((await remove(w, ana, davi)).statusCode, 204)
  assert.equal((await act(w.hub, davi, 'GET', w.base)).statusCode, 404)
  assert.equal((await act(w.hub, davi, 'GET', `${w.base}/members`)).statusCode, 404)
  assert.equal((await remove(w, ana, davi)).statusCode, 204)
  assert.deepEqual(await rolesOf(w), {
    ana: 'owner',
    bruno: 'admin',
    carla: 'admin',
    edu: 'member',
    gil: 'owner',
  })
  const elsewhere = await remove(w, ana, davi, id())
  assert.deepEqual([elsewhere.statusCode, codeOf(elsewhere)], [404, 'NOT_FOUND'])
  const unknownPerson = await act(w.hub, ana, 'DELETE', `${w.base}/members/${id()}`)
  assert.equal(unknownPerson.statusCode, 204)
})

type Cell = [
  label: string,
  actor: Name | 'central' | 'fabi',
  target: Name | 'fabi',
  role: Role,
  from: Role,
  status: number,
  changed: Roster,
]
const CELLS: Cell[] = [
  ['dono rebaixa outro dono', 'ana', 'gil', 'admin', 'owner', 200, { gil: 'admin' }],
  ['dono torna dono um membro', 'ana', 'davi', 'owner', 'member', 200, { davi: 'owner' }],
  ['dono muda administrador', 'ana', 'bruno', 'member', 'admin', 200, { bruno: 'member' }],
  [
    'dono rebaixa a si, havendo outro dono',
    'gil',
    'gil',
    'member',
    'owner',
    200,
    { gil: 'member' },
  ],
  [
    'administrador entre administrador e membro',
    'bruno',
    'carla',
    'member',
    'admin',
    200,
    { carla: 'member' },
  ],
  [
    'administrador torna administrador um membro',
    'bruno',
    'davi',
    'admin',
    'member',
    200,
    { davi: 'admin' },
  ],
  ['administrador a si', 'bruno', 'bruno', 'member', 'admin', 200, { bruno: 'member' }],
  ['administrador não muda dono', 'bruno', 'ana', 'admin', 'owner', 404, {}],
  ['administrador não dá dono', 'bruno', 'davi', 'owner', 'member', 404, {}],
  ['membro não muda ninguém', 'davi', 'edu', 'admin', 'member', 404, {}],
  ['membro não muda a si', 'davi', 'davi', 'admin', 'member', 404, {}],
  ['de fora', 'fabi', 'davi', 'admin', 'member', 404, {}],
  ['a Central muda qualquer papel', 'central', 'ana', 'member', 'owner', 200, { ana: 'member' }],
  ['a Central dá dono', 'central', 'edu', 'owner', 'member', 200, { edu: 'owner' }],
  ['o mesmo papel não muda nada', 'ana', 'davi', 'member', 'member', 200, {}],
]

test('papel: cada célula da tabela de quem muda o papel de quem, com a recusa', async (t) => {
  const w = await world(t)
  for (const [label, actor, target, role, from, status, changed] of CELLS) {
    await w.seat()
    const response = await change(w, w.people[actor], w.people[target], role, from)
    assert.equal(response.statusCode, status, label)
    if (status === 404) assert.equal(codeOf(response), 'NOT_FOUND', label)
    assert.deepEqual(await rolesOf(w), { ...FULL, ...changed }, label)
  }
})

test('papel: a resposta é a pessoa como quem muda a vê; o papel velho, 412; o único dono fica, também para a Central', async (t) => {
  const w = await world(t)
  const { ana, bruno, davi, fabi, central } = w.people
  const answered = await change(w, bruno, davi, 'admin', 'member')
  assert.deepEqual(answered.json(), {
    member: {
      personId: davi.id,
      name: 'Davi Costa',
      email: 'davi@example.test',
      role: 'admin',
      mayRemove: true,
      mayChangeTo: ['member'],
      invitationsSent: 0,
    },
  })
  await w.seat()
  const stale = await change(w, ana, davi, 'owner', 'admin')
  assert.deepEqual([stale.statusCode, codeOf(stale)], [412, 'MEMBER_STALE'])
  assert.equal((await rolesOf(w)).davi, 'member')
  const absent = await change(w, ana, fabi, 'member', 'member')
  assert.deepEqual([absent.statusCode, codeOf(absent)], [404, 'NOT_FOUND'])
  await w.seat({ ana: 'owner', davi: 'member' })
  for (const actor of [ana, central]) {
    const refused = await change(w, actor, ana, 'member', 'owner')
    assert.deepEqual([refused.statusCode, codeOf(refused)], [409, 'LAST_OWNER'])
  }
  assert.equal((await change(w, ana, davi, 'owner', 'member')).statusCode, 200)
  assert.equal((await change(w, ana, ana, 'member', 'owner')).statusCode, 200)
})

test('Central: sem virar membro, lista pessoas e convites de empresa ativa, muda papéis, tira e convida dono; outro, 404', async (t) => {
  const w = await world(t)
  const { hub, base } = w
  const { davi, edu, central } = w.people
  const listed = await act(hub, central, 'GET', `${base}/members`)
  assert.equal(listed.statusCode, 200)
  const { members } = Object(listed.json())
  assert.deepEqual(
    members.map((one: Member) => [one.email.split('@')[0], one.mayRemove, one.mayChangeTo]),
    [
      ['ana', true, ['admin', 'member']],
      ['bruno', true, ['owner', 'member']],
      ['carla', true, ['owner', 'member']],
      ['davi', true, ['owner', 'admin']],
      ['edu', true, ['owner', 'admin']],
      ['gil', true, ['admin', 'member']],
    ],
  )
  assert.equal((await act(hub, central, 'GET', `${base}/invitations`)).statusCode, 200)
  assert.equal((await change(w, central, davi, 'admin', 'member')).statusCode, 200)
  assert.equal((await remove(w, central, edu)).statusCode, 204)
  assert.deepEqual(await rolesOf(w), {
    ana: 'owner',
    bruno: 'admin',
    carla: 'admin',
    davi: 'admin',
    gil: 'owner',
  })
  assert.equal((await act(hub, central, 'GET', base)).statusCode, 404)
  assert.deepEqual(
    await hub.test.asOwner('select 1 from auth.member where user_id = $1', [central.id]),
    [],
  )
})

test('Central: convida dono como Conexus, um de cada vez e só dono; quem não é da empresa nem operador, 404', async (t) => {
  const w = await world(t)
  const { hub, base } = w
  const { ana, fabi, central } = w.people
  const owner = { email: 'hugo@example.test', role: 'owner' }
  const invited = await post(hub, central, `${base}/invitations`, owner)
  assert.equal(invited.statusCode, 201)
  const [mail] = hub.mail.sent
  assert.equal(mail?.subject, 'Convite para Empresa Teste')
  assert.ok(mail?.text.includes('Conexus convidou você para entrar em Empresa Teste'))
  const second = await post(hub, central, `${base}/invitations`, {
    ...owner,
    email: 'ines@example.test',
  })
  assert.deepEqual([second.statusCode, codeOf(second)], [409, 'OWNER_INVITATION_OPEN'])
  const asAdmin = await post(hub, central, `${base}/invitations`, { ...owner, role: 'admin' })
  assert.deepEqual([asAdmin.statusCode, codeOf(asAdmin)], [403, 'INVITATION_ROLE_REFUSED'])
  // Anyone else who is not of the company gets the same not-found.
  for (const response of [
    await act(hub, fabi, 'GET', `${base}/members`),
    await act(hub, fabi, 'GET', `${base}/invitations`),
    await remove(w, fabi, ana),
    await change(w, fabi, ana, 'member', 'owner'),
    await post(hub, fabi, `${base}/invitations`, owner),
  ]) {
    assert.deepEqual([response.statusCode, codeOf(response)], [404, 'NOT_FOUND'])
  }
})
