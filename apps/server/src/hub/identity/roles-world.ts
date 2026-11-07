import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { listRoles } from '@conexus/hub-api'
import { KIT } from './roles.ts'
import type { Person } from './test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  call,
  hubWithMail,
  memberOn,
  personOn,
  plantCompany,
} from './test-hub.ts'

export const OPERATOR = { name: 'Central Conexus', email: 'central@example.test', role: 'admin' }
export const ATENDENTE = { label: 'Atendente', connectors: { sankhya: ['pedidos'] } }
export const FINANCEIRO = ['contasAReceber', 'contasAPagar']

export async function world(t: TestContext) {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const admin = await memberOn(hub, companyId, CARLA, 'admin')
  const developer = await memberOn(
    hub,
    companyId,
    { name: 'Dora Reis', email: 'dora@example.test' },
    'developer',
  )
  const bruno = await memberOn(hub, companyId, BRUNO, 'member')
  const base = `/api/companies/${companyId}`
  return { hub, ana, admin, developer, bruno, companyId, base }
}
export type World = Awaited<ReturnType<typeof world>>

export async function roles(w: World, person: Person = w.ana) {
  const response = await call(w.hub, person, 'GET', `${w.base}/roles`)
  assert.equal(response.statusCode, 200)
  return listRoles.success.body.parse(response.json()).roles
}

export function roleOf(list: Awaited<ReturnType<typeof roles>>, name: string) {
  const found = list.find((one) => one.role === name)
  assert.ok(found, name)
  return found
}

export const everyOperation = Object.fromEntries(
  KIT.map((connector) => [connector.id, connector.operations.map(({ id }) => id)]),
)
export const everyRead = Object.fromEntries(
  KIT.map((connector) => [
    connector.id,
    connector.operations.filter(({ class: kind }) => kind === 'read').map(({ id }) => id),
  ]),
)
