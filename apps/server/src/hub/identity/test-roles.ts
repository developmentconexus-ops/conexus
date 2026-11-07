import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import type { GenericEndpointContext } from '@better-auth/core'
import { CompanyId, listRoles, PersonId } from '@conexus/hub-api'
import { hasPermission } from 'better-auth/plugins'
import type { TestDatabase } from '../../platform/test-database.ts'
import { silent, testConfig } from '../../platform/test-database.ts'
import { libraryCommandOn, ORGANIZATION } from './auth.ts'
import { createAuth } from './public.ts'
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

/** Asks the library whether the company's `member` role holds the statements, as the Hub's adapter reads its rows. */
export async function memberMay(database: TestDatabase, companyId: string, ownerId: string) {
  const auth = createAuth({
    database: database.database,
    config: testConfig(database.runtimeUrl),
    log: silent,
  })
  const command = libraryCommandOn(auth, database.database)
  const context = await auth.$context
  const scope = {
    kind: 'COMPANY',
    companyId: CompanyId.parse(companyId),
    personId: PersonId.parse(ownerId),
  } as const
  // biome-ignore lint/nursery/noUnsafeTypeAssertion: the library types its context as an endpoint's, and the permission check reads only `context`
  const endpoint = { context } as GenericEndpointContext
  return (permissions: Record<string, string[]>) =>
    command(scope, () =>
      hasPermission(
        { options: ORGANIZATION, organizationId: companyId, role: 'member', permissions },
        endpoint,
      ),
    )
}
