import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import {
  CompanyId as CompanyIdSchema,
  ConnectionId,
  PersonId,
  ProjectId as ProjectIdSchema,
} from '@conexus/hub-api'
import type { Config } from '../../platform/config.ts'
import { linkSankhya, testOf } from '../connectors/test-connections.ts'
import { sankhyaFake } from '../connectors/test-sales.ts'
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
import { ATENDENTE } from '../identity/test-roles.ts'

/** A company with Ana, its owner, Carla, a member, a Projeto, and the Sankhya double linked and tested. */
export async function companyOn(
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
  const connections = `/api/companies/${companyId}/connections`
  const linked = await linkSankhya(hub, ana, connections, fake.credential)
  assert.equal(linked.statusCode, 201, linked.body)
  const connectionId = ConnectionId.parse(Object(linked.json()).connection.id)
  const tested = await testOf(hub, ana, connections, connectionId)
  assert.equal(Object(tested.json()).connection?.state, 'ACTIVE', tested.body)
  return {
    ...{ hub, fake, ana, anaId: PersonId.parse(ana.id), carla, companyId, projectId },
    ...{ connectionId, connections, projects },
  }
}

export type CompanyOn = Awaited<ReturnType<typeof companyOn>>

async function roleOn(on: CompanyOn, label: string) {
  const made = await post(on.hub, on.ana, `/api/companies/${on.companyId}/roles`, {
    ...ATENDENTE,
    label,
  })
  assert.equal(made.statusCode, 201, made.body)
  return String(Object(made.json()).role.role)
}

/** The company with the Vendas and Financeiro roles, Bruno in Vendas and Carla moved to Financeiro. */
export async function rolesWorld(t: TestContext, also?: Parameters<typeof companyOn>[1]) {
  const on = await companyOn(t, also)
  const vendas = await roleOn(on, 'Vendas')
  const financeiro = await roleOn(on, 'Financeiro')
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, vendas)
  const url = `/api/companies/${on.companyId}/members/${on.carla.id}`
  const moved = await call(on.hub, on.ana, 'PUT', url, { role: financeiro, from: 'member' })
  assert.equal(moved.statusCode, 200, moved.body)
  return {
    ...{ on, vendas, financeiro },
    brunoId: PersonId.parse(bruno.id),
    carlaId: PersonId.parse(on.carla.id),
  }
}

export type RolesWorld = Awaited<ReturnType<typeof rolesWorld>>
