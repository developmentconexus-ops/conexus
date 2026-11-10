import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { setTimeout } from 'node:timers/promises'
import type { CopyId } from '@conexus/hub-api'
import { CompanyId, ConnectionId, PersonId, ProjectId } from '@conexus/hub-api'
import { Failure } from '../../platform/failure.ts'
import { createCompanyDatabase } from '../../platform/test-company-postgres.ts'
import { CopyName } from '../connectors/public.ts'
import { linkSankhya, testOf } from '../connectors/test-connections.ts'
import { sankhyaFake } from '../connectors/test-sales.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import { createCopies } from './public.ts'

/** The Sankhya double, served; `change` is the Hub's config pointing the connector at it (`conversing`'s third argument). */
export async function sankhyaServed(t: TestContext) {
  const fake = sankhyaFake()
  const served = await fake.serve()
  t.after(() => served.close())
  return {
    fake,
    change: <C extends { connectorOrigins?: unknown }>(config: C): C => ({
      ...config,
      connectorOrigins: new Map([['sankhya', served.origin]]),
    }),
  }
}

/** The connection the copies read: the company's Sankhya linked and tested here, or the one the test already holds. */
async function linked(
  hub: Hub,
  on: { ana: Person; companyId: string },
  from: Awaited<ReturnType<typeof sankhyaServed>> | { connectionId: string },
) {
  if ('connectionId' in from) return ConnectionId.parse(from.connectionId)
  const connections = `/api/companies/${on.companyId}/connections`
  const made = await linkSankhya(hub, on.ana, connections, from.fake.credential)
  assert.equal(made.statusCode, 201, made.body)
  const connectionId = ConnectionId.parse(Object(made.json()).connection.id)
  await testOf(hub, on.ana, connections, connectionId)
  return connectionId
}

/**
 * The company's Sankhya linked and, for each name, its copy turned on, run once and released to the
 * Projeto, through the Hub's own copies; the company's database is a test server. Returns the
 * company's database owner and the copies' ids.
 */
export async function releasing(
  t: TestContext,
  on: { hub: Hub; ana: Person; companyId: string; projectId: string },
  from: Awaited<ReturnType<typeof sankhyaServed>> | { connectionId: string },
  names: readonly string[],
  release: readonly string[] = names,
) {
  const { hub } = on
  const [neonProject] = hub.neon.projects()
  assert.ok(neonProject, 'the company database')
  const owner = await createCompanyDatabase(t)
  hub.neon.ownedBy(neonProject.id, owner)
  const connectionId = await linked(hub, on, from)
  const companyId = CompanyId.parse(on.companyId)
  const personId = PersonId.parse(on.ana.id)
  const ids = new Map<string, CopyId>()
  for (const name of names) {
    const copy = await hub.copies.enable({
      ...{ companyId, personId },
      source: { kind: 'MODEL', connectionId, model: CopyName.parse(name) },
      interval: '30m',
      attemptKey: randomUUID(),
    })
    ids.set(name, copy)
    // The Hub's own clock starts the first run on turning on; a run the test asks for waits for its lease.
    let ended = await hub.copies.run({ companyId, copyId: copy }, AbortSignal.timeout(60_000))
    for (let tries = 0; ended.kind === 'RUNNING' && tries < 200; tries += 1) {
      await setTimeout(100)
      ended = await hub.copies.run({ companyId, copyId: copy }, AbortSignal.timeout(60_000))
    }
    assert.equal(ended.kind, 'ENDED')
    if (release.includes(name))
      await hub.copies.grant({
        ...{ companyId, personId, copyId: copy },
        projectId: ProjectId.parse(on.projectId),
      })
  }
  return { owner, ids, companyId, personId, projectId: ProjectId.parse(on.projectId) }
}

/** The Hub's copies, over a database that never answers: what `projectView` meets when the Hub's database is down. */
export function copiesWithoutHubDatabase(hub: Hub) {
  const down = {
    ...hub.test.database,
    read: async (): Promise<never> => {
      throw new Failure('DATABASE_UNAVAILABLE')
    },
  }
  return createCopies({
    ...{ database: down, identity: hub.identity, projects: hub.projects.ports },
    ...{ neon: hub.neon.neon, companyPostgres: hub.postgres.companyPostgres },
    connectors: () => hub.connectors.copies,
    prove: () => hub.connectors.builder.provePage,
    apps: () => hub.apps,
    clock: () => {
      throw new Error('the view reads no clock')
    },
    log: { info: () => undefined, error: () => undefined },
    updating: () => false,
  })
}
