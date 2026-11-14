import type { Mastra } from '@mastra/core/mastra'
import { createInventoryClock } from './builder/ontology/public.ts'
import type { IdentityPorts } from './hub/identity/public.ts'
import type { InventoryConnectors, InventoryTuning } from './hub/ontology/public.ts'
import { createOntology } from './hub/ontology/public.ts'
import type { Database } from './platform/database.ts'
import type { FailureLog } from './platform/failure.ts'

/**
 * The Ontology with the Builder's workflow as its clock. `inventory` is the tests' ceilings for one
 * run, or `'off'` for the tests that do not look at it: a linked connection's reading would call
 * their double. Production leaves it out.
 */
export function ontologyOf(deps: {
  database: Database
  identity: IdentityPorts
  log: FailureLog
  connectors: () => InventoryConnectors
  mastra: () => Mastra
  inventory?: InventoryTuning | 'off'
}) {
  const { inventory } = deps
  return createOntology({
    ...{ database: deps.database, identity: deps.identity, log: deps.log },
    connectors: deps.connectors,
    clock: () =>
      inventory === 'off'
        ? { start: async () => undefined }
        : createInventoryClock({ mastra: deps.mastra() }),
    tuning: inventory === 'off' ? undefined : inventory,
  })
}
