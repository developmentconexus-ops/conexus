import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import type { GenericEndpointContext } from '@better-auth/core'
import { CompanyId, listRoles, PersonId } from '@conexus/hub-api'
import { hasPermission } from 'better-auth/plugins'
import type { TestDatabase } from '../../platform/test-database.ts'
import { silent, testConfig } from '../../platform/test-database.ts'
import { libraryCommandOn } from './auth.ts'
import { organizationWith } from './organization.ts'
import { createAuth } from './public.ts'
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
  TEST_ROLES,
} from './test-hub.ts'
import { SANKHYA_READS } from './test-kit.ts'

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

/** What the test kit offers, written out so a change of the kit's code moves nothing here (T6). */
export const everyRead = {
  sankhya: [...SANKHYA_READS],
  'mercado-livre': ['anuncios'],
}
export const everyOperation = {
  sankhya: [...everyRead.sankhya, 'lancarPedido'],
  'mercado-livre': everyRead['mercado-livre'],
}

/** Asks the library whether the company's `member` role holds the statements, as the Hub's adapter reads its rows. */
export async function memberMay(database: TestDatabase, companyId: string, ownerId: string) {
  const auth = createAuth({
    roles: TEST_ROLES,
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
        {
          options: organizationWith(TEST_ROLES),
          organizationId: companyId,
          role: 'member',
          permissions,
        },
        endpoint,
      ),
    )
}

/** What a person who may do nothing of the company's actions reads of `may`. */
export const NO_MAY = {
  manageAgents: false,
  manageAutomations: false,
  manageRoles: false,
  publishUnattendedWrite: false,
}
