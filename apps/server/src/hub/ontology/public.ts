import type { FastifyInstance } from 'fastify'
import type { InventoryDeps } from './inventory.ts'
import { searchInventory } from './inventory-search.ts'
import { createInventoryService } from './inventory-service.ts'
import type { ProposeInput } from './propose.ts'
import { proposeConcepts } from './propose.ts'
import { registerConceptRoutes, registerOntologyRoutes } from './routes.ts'

export type { ActiveSet } from './active.ts'
export { applied, hashOf, incomplete } from './active.ts'
export type {
  InventoryClock,
  InventoryConnectors,
  InventoryEnd,
  InventoryTuning,
} from './inventory.ts'
export { INVENTORY_DEFAULTS, INVENTORY_LEASE_MS } from './inventory.ts'
export type { InventorySearch, InventorySearchInput } from './inventory-search.ts'
export type { ProposeInput } from './propose.ts'
export { versionsOf } from './versions-of.ts'

/**
 * The company's Ontology (A Ontologia da empresa): the inventory of what each connection's system
 * declares about itself, and the concepts the agents propose with their proof. It reaches the
 * connectors only through the ports it is given, each door reached when called.
 */
export function createOntology(deps: InventoryDeps) {
  const inventory = createInventoryService(deps)
  return Object.freeze({
    inventory: {
      open: inventory.open,
      run: inventory.run,
      launch: inventory.launch,
      search: (input: Parameters<typeof searchInventory>[1]) =>
        searchInventory(deps.database, input),
    },
    concepts: {
      propose: (input: ProposeInput) => proposeConcepts(deps, input),
    },
    routes: (app: FastifyInstance) => {
      registerOntologyRoutes(app, inventory)
      registerConceptRoutes(app, deps)
    },
  })
}
export type Ontology = ReturnType<typeof createOntology>
