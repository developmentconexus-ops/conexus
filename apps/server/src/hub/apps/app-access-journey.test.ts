import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { AppProps } from '@conexus/app-contract'
import { serveApp } from '@conexus/app-contract'
import { APP_SESSION_HEADER } from '@conexus/hub-api'
import { z } from 'zod'
import { createCompanyDatabase } from '../../platform/test-company-postgres.ts'
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
import { browser, ESTOQUE, frameHandoff, handoff, PEDIDOS } from './test-handoff.ts'
import { folder, readyForVersions, send } from './test-versions.ts'

const ROLES = [
  { name: 'vendedor', label: 'Vendedor' },
  { name: 'gerente', label: 'Gerente' },
]
const EDU = { name: 'Edu Melo', email: 'edu@example.test' }
const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }

/**
 * Empresa A with Ana its owner and Bruno a member, mail going to a fake, and the Projeto Pedidos
 * published with ROLES; `release` publishes another version of a Projeto, `give` has a person
 * take an app with a role, through the Hub's routes.
 */
async function appCompany(t: TestContext) {
  const hub = await hubWithMail(t)
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
  function invite(email: string, role: string | null, id = projectId) {
    return post(hub, ana, `${projects}/${id}/access/invitations`, { email, role })
  }
  async function give(person: Person, email: string, role: string | null, id = projectId) {
    const invited = await invite(email, role, id)
    assert.equal(invited.statusCode, 201, invited.body)
    const invitationId = String(Object(invited.json()).invitation.id)
    const accepted = await call(hub, person, 'PUT', `/api/invitations/${invitationId}/acceptance`, {
      revision: 0,
    })
    assert.equal(accepted.statusCode, 200, accepted.body)
    return invitationId
  }
  return {
    ...{ hub, ana, bruno, companyId, projectId, projects, projectNamed, release },
    ...{ invite, give },
  }
}

type AppCompany = Awaited<ReturnType<typeof appCompany>>

async function sessionOf(hub: Hub, person: Person, host: string) {
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
  assert.equal(redeemed.statusCode, 201)
  return String(Object(redeemed.json()).session)
}

function check(hub: Hub, host: string, session: string) {
  return hub.edge.inject({
    method: 'GET',
    url: `/api/app-sessions/current?host=${host}`,
    headers: { [APP_SESSION_HEADER]: session },
  })
}

async function accessOf(hub: Hub, host: string, session: string) {
  const checked = await check(hub, host, session)
  assert.equal(checked.statusCode, 200, checked.body)
  return Object(checked.json()).caller.access
}

function refused(response: { statusCode: number; json(): unknown }) {
  return [response.statusCode, codeOf(response)]
}

async function peopleOf(c: AppCompany, id = c.projectId) {
  const read = await call(c.hub, c.ana, 'GET', `${c.projects}/${id}/access`)
  assert.equal(read.statusCode, 200, read.body)
  return Object(read.json()).people
}

test('papel no app, troca, tirar, na chamada seguinte', async (t) => {
  const c = await appCompany(t)
  const { hub, ana, bruno, projects, projectId } = c
  const carla = await personOn(hub, CARLA)
  const none = await handoff(hub, carla, { host: PEDIDOS, binding: browser().hash })
  assert.equal(none.statusCode, 404)

  await c.give(carla, CARLA.email, 'vendedor')
  const session = await sessionOf(hub, carla, PEDIDOS)
  const checked = await check(hub, PEDIDOS, session)
  assert.equal(checked.statusCode, 200, checked.body)
  assert.deepEqual(Object(checked.json()).caller, {
    personId: carla.id,
    personName: CARLA.name,
    projectId,
    projectName: 'Pedidos',
    access: { kind: 'USER', role: 'vendedor' },
  })
  assert.deepEqual(await accessOf(hub, PEDIDOS, await sessionOf(hub, bruno, PEDIDOS)), {
    kind: 'BUILDER',
  })

  // The role changed is the role of the next call, on the same session.
  const changed = await call(hub, ana, 'PUT', `${projects}/${projectId}/access/${carla.id}`, {
    role: 'gerente',
  })
  assert.equal(changed.statusCode, 200, changed.body)
  assert.deepEqual(await accessOf(hub, PEDIDOS, session), { kind: 'USER', role: 'gerente' })

  // Taken away: the session is gone, so the old token is invalid and a new pass is refused.
  const taken = await call(hub, ana, 'DELETE', `${projects}/${projectId}/access/${carla.id}`)
  assert.equal(taken.statusCode, 204)
  assert.deepEqual(refused(await check(hub, PEDIDOS, session)), [401, 'APP_SESSION_INVALID'])
  const again = await handoff(hub, carla, { host: PEDIDOS, binding: browser().hash })
  assert.equal(again.statusCode, 404)
  const frame = await frameHandoff(hub, carla, { host: PEDIDOS, binding: browser().hash })
  assert.equal(frame.statusCode, 404)
  assert.deepEqual(await peopleOf(c), [])
})

test('quem sai da empresa leva a linha que estava inerte', async (t) => {
  const c = await appCompany(t)
  const { hub, ana, companyId } = c
  const carla = await personOn(hub, CARLA)
  await c.give(carla, CARLA.email, 'vendedor')
  const session = await sessionOf(hub, carla, PEDIDOS)

  // A member: the row stays, inert, and the session calls as a member.
  const invited = await post(hub, ana, `/api/companies/${companyId}/invitations`, {
    email: CARLA.email,
    role: 'member',
  })
  assert.equal(invited.statusCode, 201, invited.body)
  const invitationId = String(Object(invited.json()).invitation.id)
  const joined = await call(hub, carla, 'PUT', `/api/invitations/${invitationId}/acceptance`, {
    revision: 0,
  })
  assert.equal(joined.statusCode, 200, joined.body)
  assert.deepEqual(await accessOf(hub, PEDIDOS, session), { kind: 'BUILDER' })

  // Taken out of the company, she takes the row with her: no session, and no new pass.
  const removed = await call(hub, ana, 'DELETE', `/api/companies/${companyId}/members/${carla.id}`)
  assert.equal(removed.statusCode, 204, removed.body)
  assert.deepEqual(refused(await check(hub, PEDIDOS, session)), [401, 'APP_SESSION_INVALID'])
  const again = await handoff(hub, carla, { host: PEDIDOS, binding: browser().hash })
  assert.equal(again.statusCode, 404)
  assert.deepEqual(await peopleOf(c), [])
})

test('outra empresa não tira o acesso a um app da empresa', async (t) => {
  const c = await appCompany(t)
  const { hub, projectId } = c
  const carla = await personOn(hub, CARLA)
  await c.give(carla, CARLA.email, 'vendedor')
  const session = await sessionOf(hub, carla, PEDIDOS)
  const davi = await personOn(hub, DAVI)
  const other = await plantCompany(hub.test, davi.id, 'Empresa B', 'empresa-b')

  // Empresa A's Projeto is not Empresa B's: nothing is taken, nothing ends.
  const foreign = `/api/companies/${other}/projects/${projectId}/access/${carla.id}`
  assert.deepEqual(refused(await call(hub, davi, 'DELETE', foreign)), [404, 'NOT_FOUND'])
  const all = await call(hub, davi, 'DELETE', `/api/companies/${other}/app-access/${carla.id}`)
  assert.equal(all.statusCode, 204, all.body)
  assert.deepEqual(await accessOf(hub, PEDIDOS, session), { kind: 'USER', role: 'vendedor' })
})

test('empresa marcada e Projeto apagado', async (t) => {
  const c = await appCompany(t)
  const { hub, ana, companyId, projects, projectId } = c
  const estoqueId = await c.projectNamed('Estoque')
  await c.release(estoqueId, ROLES)
  const carla = await personOn(hub, CARLA)
  const edu = await personOn(hub, EDU)
  const davi = await personOn(hub, DAVI)
  await c.give(carla, CARLA.email, 'vendedor')
  const session = await sessionOf(hub, carla, PEDIDOS)

  // A company marked for deletion refuses who only uses the app, as it refuses a member.
  await hub.test.asOwner(`update auth.company set deleting_since = now() where id = $1`, [
    companyId,
  ])
  assert.deepEqual(refused(await check(hub, PEDIDOS, session)), [403, 'APP_ACCESS_REFUSED'])
  await hub.test.asOwner(`update auth.company set deleting_since = null where id = $1`, [companyId])
  assert.equal((await check(hub, PEDIDOS, session)).statusCode, 200)

  // A pending invitation to a Projeto marked, and to one deleted, is closed to accept.
  const toEstoque = await c.invite(EDU.email, 'vendedor', estoqueId)
  const toPedidos = await c.invite(DAVI.email, 'gerente')
  await hub.test.asOwner(`update projects.project set deleting_since = now() where id = $1`, [
    estoqueId,
  ])
  const deleted = await call(hub, ana, 'DELETE', `${projects}/${projectId}`, { name: 'Pedidos' })
  assert.equal(deleted.statusCode, 204)
  assert.deepEqual(await hub.test.asOwner(`select count(*)::int as n from projects.app_access`), [
    { n: 0 },
  ])
  const accepted = [
    [edu, toEstoque],
    [davi, toPedidos],
  ] as const
  for (const [person, invited] of accepted) {
    const id = String(Object(invited.json()).invitation.id)
    const closed = await call(hub, person, 'PUT', `/api/invitations/${id}/acceptance`, {
      revision: 0,
    })
    assert.deepEqual(refused(closed), [422, 'INVITATION_CLOSED'])
  }
  const apps = await call(hub, carla, 'GET', '/api/apps')
  assert.deepEqual(Object(apps.json()).apps, [])
  assert.deepEqual(refused(await check(hub, PEDIDOS, session)), [404, 'APP_NOT_FOUND'])
})

// The operations of the version that no longer declares `gerente`.
const operations = {
  listar: {
    input: z.object({}),
    output: z.object({ ok: z.boolean() }),
    roles: 'everyone' as const,
  },
  criar: { input: z.object({}), output: z.object({ ok: z.boolean() }), roles: ['vendedor'] },
}
const handlers = { listar: () => ({ ok: true }), criar: () => ({ ok: true }) }

async function run(caller: AppProps['caller'], name: string) {
  const app = serveApp({ operations, handlers, roles: { vendedor: 'Vendedor' } })
  const request = new Request(`https://${PEDIDOS}.example/api/${name}`, {
    method: 'POST',
    body: '{}',
  })
  const db = { query: async () => ({ rows: [] }), batch: async () => ({ results: [] }) }
  const connectors = {
    call: async () => ({ kind: 'NOT_GRANTED' as const }),
    connections: async () => [],
  }
  return (await app.fetch(request, {}, { props: { caller, db, connectors } })).status
}

test('o papel que a versão deixa de declarar', async (t) => {
  const c = await appCompany(t)
  const { hub } = c
  const estoqueId = await c.projectNamed('Estoque')
  await c.release(estoqueId)
  const carla = await personOn(hub, CARLA)
  const edu = await personOn(hub, EDU)
  await c.give(carla, CARLA.email, 'gerente')
  await c.give(edu, EDU.email, null, estoqueId)
  const carlas = await sessionOf(hub, carla, PEDIDOS)
  const edus = await sessionOf(hub, edu, ESTOQUE)

  await c.release(c.projectId, [{ name: 'vendedor', label: 'Vendedor' }])
  await c.release(estoqueId, ROLES)

  // The rows stay, and the list marks the role the version no longer has, or never gave.
  const [carlaRow] = await peopleOf(c)
  assert.deepEqual(
    [carlaRow.personId, carlaRow.role, carlaRow.roleDeclared],
    [carla.id, 'gerente', false],
  )
  const [eduRow] = await peopleOf(c, estoqueId)
  assert.deepEqual([eduRow.personId, eduRow.role, eduRow.roleDeclared], [edu.id, null, false])

  // The call still comes in, and the app lets it only into what is open to everyone.
  for (const [session, host] of [
    [carlas, PEDIDOS],
    [edus, ESTOQUE],
  ] as const) {
    const checked = await check(hub, host, session)
    assert.equal(checked.statusCode, 200, checked.body)
    const { caller } = Object(checked.json())
    assert.equal(caller.access.kind, 'USER')
    assert.deepEqual([await run(caller, 'listar'), await run(caller, 'criar')], [200, 403])
  }
})
