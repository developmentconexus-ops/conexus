import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { APP_SESSION_HEADER } from '@conexus/hub-api'
import { createCompanyDatabase } from '../../platform/test-company-postgres.ts'
import { browser, handoff, PEDIDOS } from '../apps/test-handoff.ts'
import { folder, readyForVersions, send } from '../apps/test-versions.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  call,
  codeOf,
  hubWithMail,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../identity/test-hub.ts'

const ROLES = [
  { name: 'vendedor', label: 'Vendedor' },
  { name: 'gerente', label: 'Gerente' },
]
const EDU = { name: 'Edu Melo', email: 'edu@example.test' }
const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }

/**
 * Empresa A with Ana its owner and Bruno a member, mail going to a fake, and the Projeto Pedidos
 * with a published version that declares ROLES; `release` publishes another version of a Projeto.
 */
async function appCompany(t: TestContext) {
  const hub = await hubWithMail(t)
  const { mail } = hub
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id, 'Empresa A', 'empresa-a')
  const bruno = await memberOn(hub, companyId, BRUNO, 'member')
  await readyForVersions(t, hub, ana, companyId)
  const projects = `/api/companies/${companyId}/projects`
  async function projectNamed(name: string) {
    const made = await post(hub, ana, projects, { name })
    assert.equal(made.statusCode, 201, made.body)
    return String(Object(made.json()).project.id)
  }
  const projectId = await projectNamed('Pedidos')
  const [neonProject] = hub.neon.projects()
  if (neonProject === undefined) throw new Error('no company database')
  hub.neon.ownedBy(neonProject.id, await createCompanyDatabase(t))
  const subject = { t, hub, projects, projectId }
  async function release(id: string, roles?: typeof ROLES) {
    const color = `#${randomBytes(3).toString('hex')}`
    const sent = await send(subject, ana, folder(roles ? { roles } : {}, color), { projectId: id })
    assert.ok(sent.number !== undefined)
    const published = await call(hub, ana, 'PUT', `${projects}/${id}/published-version`, {
      number: sent.number,
    })
    assert.equal(published.statusCode, 200, published.body)
  }
  await release(projectId, ROLES)
  const access = `${projects}/${projectId}/access`
  function invite(by: Person, email: string, role: string | null, key?: string, at = access) {
    return post(hub, by, `${at}/invitations`, { email, role }, key)
  }
  async function accept(person: Person, invitationId: string) {
    const accepted = await call(hub, person, 'PUT', `/api/invitations/${invitationId}/acceptance`, {
      revision: 0,
    })
    assert.equal(accepted.statusCode, 200, accepted.body)
  }
  /** The person is invited to the Projeto by Ana and accepts. */
  async function admit(person: Person, email: string, role: string | null, at = access) {
    const invited = await invite(ana, email, role, undefined, at)
    assert.equal(invited.statusCode, 201, invited.body)
    await accept(person, String(Object(invited.json()).invitation.id))
  }
  return {
    ...{ hub, mail, ana, bruno, companyId, projectId, projects, access, projectNamed, release },
    ...{ invite, accept, admit },
  }
}

type AppCompany = Awaited<ReturnType<typeof appCompany>>

function refused(response: { statusCode: number; json(): unknown }) {
  return [response.statusCode, codeOf(response)]
}

async function listed(c: AppCompany, person: Person, at = c.access) {
  return Object((await call(c.hub, person, 'GET', at)).json())
}

async function appSession(hub: Hub, person: Person, host: string) {
  const { binding, hash } = browser()
  const made = await handoff(hub, person, { host, binding: hash })
  assert.equal(made.statusCode, 303, made.body)
  const code = String(new URL(String(made.headers.location)).searchParams.get('code'))
  const redeemed = await hub.edge.inject({
    method: 'POST',
    url: '/api/app-sessions',
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify({ host, code, binding }),
  })
  return String(Object(redeemed.json()).session)
}

function checkSession(hub: Hub, host: string, session: string) {
  return hub.edge.inject({
    method: 'GET',
    url: `/api/app-sessions/current?host=${host}`,
    headers: { [APP_SESSION_HEADER]: session },
  })
}

test('dar acesso: quem pode, e as recusas', async (t) => {
  const c = await appCompany(t)
  const { hub, mail, ana, bruno, projects, invite } = c
  const admin = await memberOn(hub, c.companyId, DAVI, 'admin')
  const carla = await personOn(hub, CARLA)
  const made = await invite(ana, CARLA.email, 'vendedor')
  assert.equal(made.statusCode, 201, made.body)
  const { id, expiresAt: _, ...invitation } = Object(made.json()).invitation
  assert.match(id, /^[A-Za-z0-9]{32}$/)
  assert.deepEqual(invitation, { email: CARLA.email, role: 'vendedor' })
  assert.equal(mail.sent.length, 1)
  assert.equal(mail.sent[0]?.to, CARLA.email)
  assert.ok(mail.sent[0]?.text.includes(`https://hub.example.test/invitations/${id}`))
  assert.match(String(mail.sent[0]?.text), /ninguém usa o app sem a sua resposta/)
  assert.equal((await invite(admin, EDU.email, 'gerente')).statusCode, 201)

  // The member cannot give access, and the e-mail of a member is no one to invite (E1).
  assert.deepEqual(refused(await invite(bruno, 'frank@example.test', 'vendedor')), [
    404,
    'NOT_FOUND',
  ])
  assert.deepEqual(refused(await invite(ana, BRUNO.email, 'vendedor')), [409, 'APP_ACCESS_MEMBER'])
  await c.accept(carla, id)
  assert.deepEqual(refused(await invite(ana, CARLA.email, 'gerente')), [409, 'APP_ACCESS_EXISTS'])

  // The role must be one the published version declares, and an app with roles gives no null one.
  assert.deepEqual(refused(await invite(ana, 'frank@example.test', 'diretor')), [
    409,
    'APP_ROLE_UNKNOWN',
  ])
  assert.deepEqual(refused(await invite(ana, 'frank@example.test', null)), [
    409,
    'APP_ROLE_UNKNOWN',
  ])
  const unpublished = `${projects}/${await c.projectNamed('Vendas')}/access`
  assert.deepEqual(
    refused(await invite(ana, 'frank@example.test', 'vendedor', undefined, unpublished)),
    [404, 'APP_NOT_PUBLISHED'],
  )

  // One attempt key is one request: another role or another Projeto under it is a conflict.
  const other = await c.projectNamed('Estoque')
  await c.release(other, ROLES)
  const key = randomUUID()
  assert.equal((await invite(ana, 'frank@example.test', 'vendedor', key)).statusCode, 201)
  const changedRole = await invite(ana, 'frank@example.test', 'gerente', key)
  const changedProject = await invite(
    ana,
    'frank@example.test',
    'vendedor',
    key,
    `${projects}/${other}/access`,
  )
  assert.deepEqual(
    [refused(changedRole), refused(changedProject)],
    Array(2).fill([409, 'IDEMPOTENCY_CONFLICT']),
  )
  assert.equal(mail.sent.length, 3)
})

test('a lista do Projeto: o membro lê e não muda', async (t) => {
  const c = await appCompany(t)
  const { hub, ana, bruno, projects } = c
  const carla = await personOn(hub, CARLA)
  const outsider = await personOn(hub, EDU)
  const first = await listed(c, ana)
  assert.deepEqual(first.roles, ROLES)
  assert.deepEqual(
    [first.published, first.mayManage, first.people, first.invitations],
    [true, true, [], []],
  )
  assert.deepEqual(first.members.map((member: { email: string }) => member.email).sort(), [
    'ana@example.test',
    'bruno@example.test',
  ])
  const asMember = await listed(c, bruno)
  assert.deepEqual([asMember.mayManage, asMember.roles, asMember.people], [false, ROLES, []])

  const invited = await c.invite(ana, CARLA.email, 'vendedor')
  const invitationId = String(Object(invited.json()).invitation.id)
  const pending = await listed(c, bruno)
  assert.deepEqual(
    pending.invitations.map((each: { id: string; email: string; role: string }) => [
      each.id,
      each.email,
      each.role,
    ]),
    [[invitationId, CARLA.email, 'vendedor']],
  )
  await c.accept(carla, invitationId)
  const given = await listed(c, ana)
  assert.equal(given.invitations.length, 0)
  const [row, ...rest] = given.people
  assert.equal(rest.length, 0)
  const { grantedAt, ...person } = row
  assert.ok(Number.isFinite(Date.parse(grantedAt)))
  assert.deepEqual(person, {
    personId: carla.id,
    name: CARLA.name,
    email: CARLA.email,
    role: 'vendedor',
    roleDeclared: true,
  })
  // The members stay under `members`, never among the people given the app.
  assert.deepEqual(
    given.members.map((member: { personId: string }) => member.personId).sort(),
    [ana.id, bruno.id].sort(),
  )

  const unpublished = `${projects}/${await c.projectNamed('Vendas')}/access`
  const empty = await listed(c, ana, unpublished)
  assert.deepEqual([empty.roles, empty.published], [[], false])
  assert.deepEqual(refused(await call(hub, outsider, 'GET', c.access)), [404, 'NOT_FOUND'])
})

test('trocar, tirar e cancelar: as recusas e o de novo', async (t) => {
  const c = await appCompany(t)
  const { hub, ana, bruno, access } = c
  const carla = await personOn(hub, CARLA)
  await c.admit(carla, CARLA.email, 'vendedor')
  const pending = await c.invite(ana, EDU.email, 'vendedor')
  const pendingId = String(Object(pending.json()).invitation.id)
  const one = `${access}/${carla.id}`

  // The member gets 404 on all three, and nothing changes.
  const asMember = [
    await call(hub, bruno, 'PUT', one, { role: 'gerente' }),
    await call(hub, bruno, 'DELETE', one),
    await call(hub, bruno, 'DELETE', `${access}/invitations/${pendingId}`),
  ]
  assert.deepEqual(asMember.map(refused), Array(3).fill([404, 'NOT_FOUND']))
  const same = await listed(c, ana)
  assert.deepEqual(
    [same.people.map((row: { role: string }) => row.role), same.invitations.length],
    [['vendedor'], 1],
  )

  const changed = await call(hub, ana, 'PUT', one, { role: 'gerente' })
  assert.equal(changed.statusCode, 200, changed.body)
  assert.deepEqual(Object(changed.json()).person.role, 'gerente')
  assert.deepEqual(refused(await call(hub, ana, 'PUT', one, { role: 'diretor' })), [
    409,
    'APP_ROLE_UNKNOWN',
  ])
  assert.deepEqual(
    refused(await call(hub, ana, 'PUT', `${access}/${bruno.id}`, { role: 'gerente' })),
    [404, 'NOT_FOUND'],
  )
  assert.deepEqual((await listed(c, ana)).people[0].role, 'gerente')

  const cancelled = await call(hub, ana, 'DELETE', `${access}/invitations/${pendingId}`)
  assert.equal(cancelled.statusCode, 204)
  assert.equal((await listed(c, ana)).invitations.length, 0)

  // Taking it again, with no row left, is the same answer.
  assert.equal((await call(hub, ana, 'DELETE', one)).statusCode, 204)
  assert.equal((await call(hub, ana, 'DELETE', one)).statusCode, 204)
  assert.deepEqual((await listed(c, ana)).people, [])
})

test('a lista da empresa e o tirar de todos', async (t) => {
  const c = await appCompany(t)
  const { hub, ana, bruno, companyId, projects, projectId } = c
  const estoqueId = await c.projectNamed('Estoque')
  await c.release(estoqueId, ROLES)
  const estoque = `${projects}/${estoqueId}/access`
  const carla = await personOn(hub, CARLA)
  const edu = await personOn(hub, EDU)
  await c.admit(carla, CARLA.email, 'vendedor')
  await c.admit(edu, EDU.email, 'gerente')
  // Edu then becomes a member: the row stays and is inert.
  await hub.test.asOwner(
    `insert into auth.member (id, company_id, user_id, role, created_at)
      values ($1, $2, $3, 'member', now())`,
    [randomBytes(16).toString('hex'), companyId, edu.id],
  )
  const company = `/api/companies/${companyId}/app-access`
  const read = await call(hub, bruno, 'GET', company)
  assert.equal(read.statusCode, 200, read.body)
  assert.equal(Object(read.json()).mayManage, false)
  assert.equal(Object((await call(hub, ana, 'GET', company)).json()).mayManage, true)
  const mine = Object((await call(hub, carla, 'GET', '/api/apps')).json())
  assert.equal(mine.apps[0].projectName, 'Pedidos')
  assert.deepEqual(Object(read.json()).people, [
    {
      personId: carla.id,
      name: CARLA.name,
      email: CARLA.email,
      apps: [{ projectId, projectName: 'Pedidos', role: 'vendedor', roleLabel: 'Vendedor' }],
    },
  ])
  const kept = 'select count(*)::int as n from projects.app_access where person_id = $1'
  assert.deepEqual(await hub.test.asOwner(kept, [edu.id]), [{ n: 1 }])

  await c.admit(carla, CARLA.email, 'gerente', estoque)
  assert.equal((await call(hub, ana, 'DELETE', `${c.access}/${carla.id}`)).statusCode, 204)
  const left = Object((await call(hub, ana, 'GET', company)).json()).people[0].apps
  assert.equal(left[0].projectName, 'Estoque')
  assert.equal((await call(hub, ana, 'DELETE', `${estoque}/${carla.id}`)).statusCode, 204)
  await c.admit(carla, CARLA.email, 'vendedor')

  // Carla also gets Estoque as a pending invitation and has a live session in Pedidos.
  const pending = await c.invite(ana, CARLA.email, 'gerente', undefined, estoque)
  const pendingId = String(Object(pending.json()).invitation.id)
  const session = await appSession(hub, carla, PEDIDOS)
  assert.equal((await checkSession(hub, PEDIDOS, session)).statusCode, 200)

  assert.deepEqual(refused(await call(hub, bruno, 'DELETE', `${company}/${carla.id}`)), [
    404,
    'NOT_FOUND',
  ])
  assert.equal((await call(hub, ana, 'DELETE', `${company}/${carla.id}`)).statusCode, 204)
  assert.deepEqual(Object(Object((await call(hub, ana, 'GET', company)).json())).people, [])
  assert.deepEqual(refused(await checkSession(hub, PEDIDOS, session)), [401, 'APP_SESSION_INVALID'])
  const link = await hub.app.inject({
    method: 'GET',
    url: `/api/invitations/${pendingId}`,
    headers: { cookie: carla.cookie },
  })
  assert.equal(Object(link.json()).invitation.kind, 'CLOSED')
  assert.equal((await call(hub, ana, 'DELETE', `${company}/${carla.id}`)).statusCode, 204)
})
