import type { FastifyInstance } from 'fastify'
import type { InventoryDeps } from './inventory.ts'
import { searchInventory } from './inventory-search.ts'
import { createInventoryService } from './inventory-service.ts'
import { registerOntologyRoutes } from './routes.ts'

export type {
  InventoryClock,
  InventoryConnectors,
  InventoryEnd,
  InventoryTuning,
} from './inventory.ts'
export type { InventorySearch, InventorySearchInput } from './inventory-search.ts'

/**
 * The company's Ontology (A Ontologia da empresa): today the inventory of what each connection's
 * system declares about itself; the concepts come with the next units. It reaches the connectors
 * only through the port it is given, each door reached when called.
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
    routes: (app: FastifyInstance) => registerOntologyRoutes(app, inventory),
  })
}
export type Ontology = ReturnType<typeof createOntology>
