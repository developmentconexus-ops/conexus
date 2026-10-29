import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { appHostOf, HostLabel } from '@conexus/hub-api'
import { createCompanyDatabase } from '../../platform/test-company-postgres.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { browser, frameHandoff, PEDIDOS } from '../apps/test-handoff.ts'
import { folder, readyForVersions, send } from '../apps/test-versions.ts'
import type { Hub, Person } from './test-hub.ts'
import {
  ANA_OWNER,
  CARLA,
  call,
  codeOf,
  hubWithMail,
  personOn,
  plantCompany,
  post,
} from './test-hub.ts'

const ROLES = [
  { name: 'vendedor', label: 'Vendedor' },
  { name: 'gerente', label: 'Gerente' },
]
const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }

/**
 * Empresa A with Ana its owner and the Projeto Pedidos published with ROLES, mail going to a fake;
 * `invite` has Ana invite an e-mail to Pedidos (or another Projeto) and returns the invitation's id.
 */
async function appCompany(t: TestContext) {
  const hub = await hubWithMail(t)
  const { mail } = hub
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id, 'Empresa A', 'empresa-a')
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
  async function publish(id: string) {
    const color = `#${randomBytes(3).toString('hex')}`
    const sent = await send(subject, ana, folder({ roles: ROLES }, color), { projectId: id })
    assert.ok(sent.number !== undefined)
    const published = await call(hub, ana, 'PUT', `${projects}/${id}/published-version`, {
      number: sent.number,
    })
    assert.equal(published.statusCode, 200, published.body)
  }
  await publish(projectId)
  async function invite(email: string, role: string | null = 'vendedor', id = projectId) {
    const made = await post(hub, ana, `${projects}/${id}/access/invitations`, { email, role })
    assert.equal(made.statusCode, 201, made.body)
    return String(Object(made.json()).invitation.id)
  }
  const address = appHostOf({ label: HostLabel.parse(PEDIDOS), appsDomain: hub.config.appsDomain })
  return { hub, mail, ana, companyId, projectId, projects, projectNamed, publish, invite, address }
}

const ENTRY = {
  origin: TEST_ORIGIN,
  'content-type': 'application/json',
  'cf-connecting-ip': '203.0.113.9',
}

function accept(hub: Hub, person: Person, invitationId: string, revision = 0) {
  const url = `/api/invitations/${invitationId}/acceptance`
  return call(hub, person, 'PUT', url, { revision })
}

async function link(hub: Hub, person: Person | undefined, invitationId: string) {
  const read = await hub.app.inject({
    method: 'GET',
    url: `/api/invitations/${invitationId}`,
    headers: person ? { cookie: person.cookie } : {},
  })
  assert.equal(read.statusCode, 200, read.body)
  return Object(read.json()).invitation
}

/** The password a new person creates from the invitation, and the session it signs in with. */
async function createdPassword(hub: Hub, name: string, invitationId: string) {
  return hub.app.inject({
    method: 'PUT',
    url: `/api/invitations/${invitationId}/password`,
    headers: ENTRY,
    payload: JSON.stringify({ name, password: 'senha-nova-1', revision: 0 }),
  })
}

async function signedInAs(hub: Hub, email: string): Promise<Person> {
  const signed = await hub.app.inject({
    method: 'PUT',
    url: '/api/sessions/current',
    headers: ENTRY,
    payload: JSON.stringify({ email, password: 'senha-nova-1' }),
  })
  assert.equal(signed.statusCode, 200, signed.body)
  return { id: '', cookie: String(signed.headers['set-cookie']).split(';')[0] ?? '' }
}

function refused(response: { statusCode: number; json(): unknown }) {
  return [response.statusCode, codeOf(response)]
}

test('o convite de um app: aceitar não faz membro, e leva ao app', async (t) => {
  const c = await appCompany(t)
  const { hub, companyId, projects, projectId, address } = c
  const carla = await personOn(hub, CARLA)
  const forCarla = await c.invite(CARLA.email)
  const forDavi = await c.invite(DAVI.email, 'gerente')
  const entry = { projectName: 'Pedidos', companyName: 'Empresa A', address }

  // Carla has an account: the link shows the app, with no company role.
  const { expiresAt, ...open } = await link(hub, carla, forCarla)
  assert.ok(Number.isFinite(Date.parse(expiresAt)))
  assert.deepEqual(open, {
    kind: 'INVITED',
    revision: 0,
    company: { id: companyId, name: 'Empresa A' },
    role: null,
    app: { projectName: 'Pedidos' },
    inviterName: 'Ana Lima',
    firstOwner: false,
  })
  // Davi has none: he creates the password from the link, signs in and accepts.
  const set = await createdPassword(hub, DAVI.name, forDavi)
  assert.equal(set.statusCode, 204, set.body)
  const davi = await signedInAs(hub, DAVI.email)
  const opened = await link(hub, davi, forDavi)
  assert.equal(opened.app.projectName, 'Pedidos')

  for (const [person, invitationId, revision] of [
    [carla, forCarla, 0],
    [davi, forDavi, opened.revision],
  ] as const) {
    const accepted = await accept(hub, person, invitationId, revision)
    assert.equal(accepted.statusCode, 200, accepted.body)
    assert.deepEqual(accepted.json(), {
      company: { id: companyId, name: 'Empresa A' },
      app: entry,
    })
    const again = await accept(hub, person, invitationId, revision)
    assert.deepEqual([again.statusCode, again.body], [200, accepted.body])
    // No member: the company's lists and the Prévia are closed to them.
    const companies = await call(hub, person, 'GET', '/api/companies')
    assert.deepEqual(Object(companies.json()).companies, [])
    const closed = [
      await call(hub, person, 'GET', projects),
      await call(hub, person, 'GET', `${projects}/${projectId}`),
      await call(hub, person, 'GET', `/api/companies/${companyId}/members`),
      await frameHandoff(hub, person, { host: PEDIDOS, binding: browser().hash }),
    ]
    assert.deepEqual(closed.map(refused), Array(4).fill([404, 'NOT_FOUND']))
    const joined = await link(hub, person, invitationId)
    assert.deepEqual(joined, {
      kind: 'JOINED',
      company: { id: companyId, name: 'Empresa A' },
      app: entry,
    })
  }
  assert.deepEqual(await hub.test.asOwner(`select count(*)::int as n from auth.member`), [{ n: 1 }])
  assert.deepEqual(await hub.test.asOwner(`select count(*)::int as n from projects.app_access`), [
    { n: 2 },
  ])
})

test('tirar o acesso fecha o convite pendente', async (t) => {
  const c = await appCompany(t)
  const { hub, ana, projects, projectId } = c
  const carla = await personOn(hub, CARLA)
  const invitationId = await c.invite(CARLA.email)
  assert.equal((await link(hub, carla, invitationId)).kind, 'INVITED')
  const taken = await call(hub, ana, 'DELETE', `${projects}/${projectId}/access/${carla.id}`)
  assert.equal(taken.statusCode, 204)
  assert.deepEqual(await link(hub, carla, invitationId), { kind: 'CLOSED', state: 'CANCELED' })
  assert.deepEqual(refused(await accept(hub, carla, invitationId)), [422, 'INVITATION_CLOSED'])
  assert.deepEqual(await hub.test.asOwner(`select count(*)::int as n from projects.app_access`), [
    { n: 0 },
  ])
})

test('Seus apps', async (t) => {
  const c = await appCompany(t)
  const { hub, address } = c
  const estoqueId = await c.projectNamed('Estoque')
  await c.publish(estoqueId)
  const carla = await personOn(hub, CARLA)
  async function apps() {
    return Object((await call(hub, carla, 'GET', '/api/apps')).json())
  }
  assert.deepEqual(await apps(), { apps: [] })
  assert.equal((await accept(hub, carla, await c.invite(CARLA.email))).statusCode, 200)
  assert.deepEqual(await apps(), {
    apps: [{ projectName: 'Pedidos', companyName: 'Empresa A', address }],
  })
  assert.equal(
    (await accept(hub, carla, await c.invite(CARLA.email, 'gerente', estoqueId))).statusCode,
    200,
  )
  const { apps: both } = await apps()
  assert.deepEqual(both.map((app: { projectName: string }) => app.projectName).sort(), [
    'Estoque',
    'Pedidos',
  ])
  const signedOut = await hub.app.inject({ method: 'GET', url: '/api/apps' })
  assert.equal(signedOut.statusCode, 401)
})

test('o convite da empresa com um de app aberto', async (t) => {
  const c = await appCompany(t)
  const { hub, ana, companyId } = c
  const estoqueId = await c.projectNamed('Estoque')
  await c.publish(estoqueId)
  const carla = await personOn(hub, CARLA)
  const forPedidos = await c.invite(CARLA.email)

  // Another app's invitation leaves the first open.
  const forEstoque = await c.invite(CARLA.email, 'gerente', estoqueId)
  assert.equal((await link(hub, carla, forPedidos)).kind, 'INVITED')

  // The company's own routes do not see an app's invitation.
  const invitations = `/api/companies/${companyId}/invitations`
  const renewed = await call(hub, ana, 'PUT', `${invitations}/${forPedidos}`, { revision: 0 })
  const canceled = await call(hub, ana, 'DELETE', `${invitations}/${forPedidos}`, { revision: 0 })
  assert.deepEqual([renewed, canceled].map(refused), Array(2).fill([404, 'NOT_FOUND']))
  const listed = await call(hub, ana, 'GET', invitations)
  assert.deepEqual(Object(listed.json()).invitations, [])
  assert.equal((await link(hub, carla, forPedidos)).kind, 'INVITED')

  // The company's invitation for the same e-mail takes the app's invitations out (I).
  const company = await post(hub, ana, invitations, { email: CARLA.email, role: 'member' })
  assert.equal(company.statusCode, 201, company.body)
  for (const id of [forPedidos, forEstoque]) {
    assert.equal((await link(hub, carla, id)).kind, 'CLOSED')
  }
  const after = await call(hub, ana, 'GET', invitations)
  assert.deepEqual(
    Object(after.json()).invitations.map((each: { email: string }) => each.email),
    [CARLA.email],
  )
})

test('o convite de app vencido não dá o app', async (t) => {
  const c = await appCompany(t)
  const { hub } = c
  const carla = await personOn(hub, CARLA)
  const forCarla = await c.invite(CARLA.email)
  const forDavi = await c.invite(DAVI.email)
  await hub.test.asOwner(
    `update auth.invitation set expires_at = now() - interval '1 second' where id = any($1)`,
    [[forCarla, forDavi]],
  )
  assert.deepEqual(await link(hub, carla, forCarla), { kind: 'CLOSED', state: 'EXPIRED' })
  assert.deepEqual(await link(hub, undefined, forDavi), { kind: 'CLOSED', state: 'EXPIRED' })
  assert.deepEqual(refused(await accept(hub, carla, forCarla)), [422, 'INVITATION_CLOSED'])
  const set = await createdPassword(hub, DAVI.name, forDavi)
  assert.deepEqual(refused(set), [422, 'INVITATION_CLOSED'])
  assert.deepEqual(await hub.test.asOwner(`select count(*)::int as n from projects.app_access`), [
    { n: 0 },
  ])
  assert.deepEqual(
    await hub.test.asOwner(`select count(*)::int as n from auth.user where email = $1`, [
      DAVI.email,
    ]),
    [{ n: 0 }],
  )
  assert.deepEqual(Object((await call(hub, carla, 'GET', '/api/apps')).json()), { apps: [] })
})
