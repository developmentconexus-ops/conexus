import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { sankhyaFake } from '@conexus/connectors'
import { APP_SESSION_HEADER } from '@conexus/hub-api'
import { browser, handoff } from '../apps/test-handoff.ts'
import { folder } from '../apps/test-versions.ts'
import type { Person } from '../identity/test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  call,
  hubWithLog,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../identity/test-hub.ts'
import { linkSankhya, testOf } from './test-connections.ts'

export { BUILDER_CALLS_PER_RUN } from './builder-port.ts'
export { shaped } from './cut.ts'
export { readOf } from './grants.ts'

export const HOST = 'pedidos--empresa-a'
export const READS = [{ connector: 'sankhya', operations: ['empresas'] }]

/** The ids of a Projeto and its connections' routes. */
function routesOf(companyId: string, projectId: string) {
  return {
    connections: `/api/companies/${companyId}/connections`,
    grant: (connectionId: string) =>
      `/api/companies/${companyId}/projects/${projectId}/connections/${connectionId}`,
  }
}

/** A published version that declares `declared`, the company's database host, and Ana's app session on the Projeto's host. */
async function plantedSession(
  hub: Awaited<ReturnType<typeof hubWithLog>>,
  a: { ana: Person; companyId: string; projectId: string; declared: readonly object[] },
) {
  const { ana, companyId, projectId } = a
  const versionId = randomUUID().replaceAll('-', '')
  await hub.test.asOwner(
    'insert into apps.app (project_id, company_id) values ($1, $2) on conflict do nothing',
    [projectId, companyId],
  )
  await hub.test.asOwner(
    `insert into apps.app_version (id, company_id, project_id, number, state, manifest, digest,
       sent_by, attempt_key, created_at)
     values ($1, $2, $3, 1, 'ready', $4::jsonb, repeat('0', 64), $5, $1, now())`,
    [
      versionId,
      companyId,
      projectId,
      JSON.stringify(folder({ connectors: a.declared }).manifest),
      ana.id,
    ],
  )
  await hub.test.asOwner(
    'update apps.app set live_version_id = $1, published_version_id = $1 where project_id = $2',
    [versionId, projectId],
  )
  // The company's database as Neon would have named it, so the app's session can say where its Worker connects.
  await hub.test.asOwner(
    "update projects.company_database set host = 'db.test.invalid' where company_id = $1",
    [companyId],
  )
  const { binding, hash } = browser()
  const pass = await handoff(hub, ana, { host: HOST, binding: hash })
  const code = String(new URL(String(pass.headers.location)).searchParams.get('code'))
  const redeemed = await hub.edge.inject({
    method: 'POST',
    url: '/api/app-sessions',
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify({ host: HOST, code, binding }),
  })
  assert.equal(redeemed.statusCode, 201, redeemed.body)
  const session = String(Object(redeemed.json()).session)

  return session
}

/**
 * Empresa A on a Hub whose Sankhya is the kit's double: Ana its owner, Bruno an administrator, Carla
 * a member, the Projeto Pedidos with a published version that declares `declared`, and Ana's app
 * session on its host, as the dispatcher holds it.
 */
export async function appCalls(
  t: TestContext,
  a: {
    declared?: readonly object[]
    /** The origin the Hub is given for the double, when something stands in front of it. */
    through?: (origin: string) => Promise<string>
  } = {},
) {
  const fake = sankhyaFake()
  const served = await fake.serve()
  t.after(() => served.close())
  const origin = a.through === undefined ? served.origin : await a.through(served.origin)
  const hub = await hubWithLog(t, (config) => ({
    ...config,
    connectorOrigins: new Map([['sankhya', origin]]),
  }))
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id, 'Empresa A', 'empresa-a')
  const bruno = await memberOn(hub, companyId, BRUNO, 'admin')
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  const made = await post(hub, ana, `/api/companies/${companyId}/projects`, { name: 'Pedidos' })
  const projectId = String(Object(made.json()).project.id)
  const routes = routesOf(companyId, projectId)
  const session = await plantedSession(hub, {
    ana,
    companyId,
    projectId,
    declared: a.declared ?? READS,
  })

  /** A connection of the Sankhya double, tested to ACTIVE and (when `granted`) released to the Projeto. */
  async function connect(name: string, granted = true) {
    const linked = await linkSankhya(hub, ana, routes.connections, fake.credential, undefined, name)
    const id = String(Object(linked.json()).connection.id)
    assert.equal(Object((await testOf(hub, ana, routes.connections, id)).json()).result, 'WORKING')
    if (granted) assert.equal((await call(hub, ana, 'PUT', routes.grant(id))).statusCode, 200)
    return id
  }

  /** The dispatcher's call, by the edge door. */
  function read(
    body: object = {},
    headers: Record<string, string> = { [APP_SESSION_HEADER]: session },
  ) {
    return hub.edge.inject({
      method: 'POST',
      url: '/api/app-connector-calls',
      headers: { 'content-type': 'application/json', ...headers },
      payload: JSON.stringify({
        host: HOST,
        connector: 'sankhya',
        operation: 'empresas',
        connection: null,
        input: { page: 0 },
        deadlineMs: 5000,
        ...body,
      }),
    })
  }

  return {
    hub,
    fake,
    served,
    ana,
    bruno,
    carla,
    companyId,
    projectId,
    routes,
    session,
    connect,
    read,
  }
}
export type AppCalls = Awaited<ReturnType<typeof appCalls>>
export type { Person }
