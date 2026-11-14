import type { CompanyId, ConnectionId, InventoryView, PersonId } from '@conexus/hub-api'
import { Failure } from '../../platform/failure.ts'
import type { InventoryDeps, Opened } from './inventory.ts'
import { createInventory } from './inventory.ts'
import { inventoryViewIn } from './inventory-view.ts'

type OfPerson = Readonly<{ companyId: CompanyId; connectionId: ConnectionId; personId: PersonId }>

/** The inventory as people reach it: the page's view and Ler de novo, each admitted as the connections are (readConnections, manageConnections). */
export function createInventoryService(deps: InventoryDeps) {
  const inventory = createInventory(deps)
  const { database, identity } = deps

  async function admitted(input: OfPerson, action: 'readConnections' | 'manageConnections') {
    const scope = { kind: 'COMPANY', companyId: input.companyId, personId: input.personId } as const
    // A command: an action that decides on a role locks it, and a read-only transaction cannot.
    const proof = await database.command(scope, (tx) =>
      identity.admitMember({ tx, ...input, action }),
    )
    // A connection of another company is not found, as the connections' own routes say.
    if ((await deps.connectors().sourceOf(input)) === undefined) throw new Failure('NOT_FOUND')
    return proof
  }

  async function view(input: OfPerson): Promise<InventoryView> {
    const proof = await admitted(input, 'readConnections')
    const scope = { kind: 'COMPANY', companyId: input.companyId, personId: input.personId } as const
    const seen = await database.read(scope, (tx) => inventoryViewIn(tx, input))
    return { ...seen, mayRun: identity.allows(proof.role, 'manageConnections') }
  }

  async function rerun(input: OfPerson): Promise<Opened> {
    await admitted(input, 'manageConnections')
    return inventory.launch(input)
  }

  return { view, rerun, ...inventory }
}
export type InventoryService = ReturnType<typeof createInventoryService>
