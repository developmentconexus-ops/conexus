import type { CatalogSystem } from '@conexus/hub-api'
import { OperationId } from '@conexus/hub-api'
import type { Database } from '../../platform/database.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { personOf, withinVersion } from '../identity/public.ts'
import type { AccessSources } from './model.ts'
import { chosenIn } from './model.ts'
import type { Principal } from './principal.ts'
import { operationLeaf } from './reach.ts'
import type { AccessView } from './view.ts'
import { viewOf } from './view.ts'

export type { AccessSources, Consumer, ConsumerContext, Place } from './model.ts'
export { chosenIn } from './model.ts'
export { Principal, principalFor } from './principal.ts'
export { operationLeaf } from './reach.ts'
export type { AccessView } from './view.ts'

export type AccessDeps = Readonly<{
  database: Database
  identity: Pick<IdentityPorts, 'admitMember' | 'mayUseEach'>
  sources: AccessSources
}>

function targetsOf(systems: readonly CatalogSystem[]) {
  return systems.flatMap((system) =>
    [...system.reads, ...system.actions].map(({ operation }) => ({
      connectionId: system.connection,
      connectorId: system.connector,
      operationId: OperationId.parse(operation),
    })),
  )
}

/** The one door that says what a principal may use and lists it. */
export function createAccess(deps: AccessDeps) {
  async function viewFor(principal: Principal): Promise<AccessView> {
    const { companyId, personId, place } = principal
    const read = await deps.database.read({ kind: 'COMPANY', companyId, personId }, async (tx) => {
      const proof = await deps.identity.admitMember({
        ...{ tx, companyId, personId },
        action: 'readCompany',
      })
      const systems = await deps.sources.systems(tx, { companyId, place })
      const chosen = systems.filter((system) => chosenIn(principal.choice, system.connection))
      return { role: proof.role, systems: chosen }
    })
    const person = personOf(personId, read.role)
    const speaker =
      principal.declared === undefined ? person : withinVersion(person, principal.declared)
    const targets = targetsOf(read.systems)
    const answers = await deps.identity.mayUseEach(companyId, speaker, targets)
    const allowed = new Set(
      targets
        .filter((_, index) => answers[index] === true)
        .map((target) => operationLeaf(target.connectionId, target.operationId)),
    )
    return viewOf({ systems: read.systems, allowed })
  }
  return Object.freeze({ viewOf: viewFor })
}

export type Access = ReturnType<typeof createAccess>
