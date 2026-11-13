import type { FastifyInstance } from 'fastify'
import type { InventoryDeps } from './inventory.ts'
import { createInventoryService } from './inventory-service.ts'
import { registerOntologyRoutes } from './routes.ts'

export type { InventoryClock, InventoryConnectors, InventoryEnd, Opened } from './inventory.ts'

/**
 * The company's Ontology (A Ontologia da empresa): today the inventory of what each connection's
 * system declares about itself; the concepts come with the next units. It reaches the connectors
 * only through the port it is given, each door reached when called.
 */
export function createOntology(deps: InventoryDeps) {
  const inventory = createInventoryService(deps)
  return Object.freeze({
    inventory: { open: inventory.open, run: inventory.run, launch: inventory.launch },
    routes: (app: FastifyInstance) => registerOntologyRoutes(app, inventory),
  })
}
export type Ontology = ReturnType<typeof createOntology>
