import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import type { CopyId } from '@conexus/hub-api'
import {
  CompanyId as CompanyIdSchema,
  ConnectionId,
  PersonId,
  ProjectId as ProjectIdSchema,
} from '@conexus/hub-api'
import type { Config } from '../../platform/config.ts'
import type { CopyRows } from '../../platform/copy-sql.ts'
import { createCompanyDatabase } from '../../platform/test-company-postgres.ts'
import { linkSankhya, testOf } from '../connectors/test-connections.ts'
import { sankhyaFake } from '../connectors/test-sales.ts'
import {
  ANA_OWNER,
  CARLA,
  hubWithLog,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../identity/test-hub.ts'
import { createCopies } from './public.ts'
import { reconciled } from './readers.ts'
import type { PlantedRun } from './test-planted.ts'
import { doubleRows, plantCopy, plantedModel } from './test-planted.ts'

export async function copiesOn(
  t: TestContext,
  /** Another double's configuration, before the Sankhya's is added to it. */
  also: (config: Config) => Config = (same) => same,
) {
  const fake = sankhyaFake()
  const served = await fake.serve()
  t.after(() => served.close())
  const hub = await hubWithLog(t, (given) => ({
    ...also(given),
    connectorOrigins: new Map([
      ...(also(given).connectorOrigins ?? []),
      ['sankhya', served.origin],
    ]),
  }))
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = CompanyIdSchema.parse(
    await plantCompany(hub.test, ana.id, 'Empresa A', 'empresa-a'),
  )
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  const projects = `/api/companies/${companyId}/projects`
  const made = await post(hub, ana, projects, { name: 'Pedidos' })
  assert.equal(made.statusCode, 201, made.body)
  const projectId = ProjectIdSchema.parse(Object(made.json()).project.id)
  const [neonProject] = hub.neon.projects()
  assert.ok(neonProject, 'the company database')
  const owner = await createCompanyDatabase(t)
  hub.neon.ownedBy(neonProject.id, owner)
  const connections = `/api/companies/${companyId}/connections`
  const linked = await linkSankhya(hub, ana, connections, fake.credential)
  assert.equal(linked.statusCode, 201, linked.body)
  const connectionId = ConnectionId.parse(Object(linked.json()).connection.id)
  const tested = await testOf(hub, ana, connections, connectionId)
  assert.equal(Object(tested.json()).connection?.state, 'ACTIVE', tested.body)
  const deps = {
    ...{ database: hub.test.database, identity: hub.identity, projects: hub.projects.ports },
    ...{ neon: hub.neon.neon, companyPostgres: hub.postgres.companyPostgres },
    apps: () => hub.apps,
    log: { info: hubLog(hub.lines), error: hubLog(hub.lines) },
  }
  const copies = createCopies(deps)
  const anaId = PersonId.parse(ana.id)
  function reconcile() {
    return reconciled(deps, { companyId, personId: anaId })
  }
  async function plant(
    model: string,
    options: { rows?: CopyRows; runs?: readonly PlantedRun[] } = {},
  ): Promise<CopyId> {
    const { label, definition } = plantedModel(model)
    const runs = options.runs ?? [{ outcome: 'COMPLETE' }]
    const rows = options.rows ?? (runs.length === 0 ? [] : doubleRows(model))
    const copyId = await plantCopy(
      { hub, companyId, anaId, owner },
      `sankhya_${model}`,
      definition,
      { connector: 'sankhya', connection: connectionId },
      { label, rows, runs },
    )
    if (runs.length > 0) assert.equal(await reconcile(), 'DONE')
    return copyId
  }
  return {
    ...{ hub, fake, ana, anaId, carla, companyId, projectId, owner, connectionId },
    ...{ copies, projects, connections, plant, reconcile },
  }
}

export type CopiesOn = Awaited<ReturnType<typeof copiesOn>>

export function copiesUrl(on: Pick<CopiesOn, 'companyId'>) {
  return `/api/companies/${on.companyId}/copies`
}

function hubLog(lines: { fields: Record<string, unknown>; message: string }[]) {
  return (fields: Record<string, unknown>, message: string) => {
    lines.push({ fields, message })
  }
}

export const SANKHYA_REFUSED = { status: 200, code: '0', message: 'Serviço recusado' } as const

export { TEST_APP_LOGIN_KEY } from '../../platform/test-cloudflare.ts'
export { asSync, syncRows } from './test-planted.ts'
