import type { CompanyId, ConnectionId, Person } from '@conexus/hub-api'
import { getInventory, runInventory } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import type { InventoryService } from './inventory-service.ts'

/** The inventory's two routes: the counts of a connection's inventory, and Ler de novo. */
export function registerOntologyRoutes(app: FastifyInstance, inventory: InventoryService): void {
  serve(app, getInventory, async ({ person, params }) =>
    answer(await inventory.view(ofPerson(person, params))),
  )
  serve(app, runInventory, async ({ person, params }) => {
    const opened = await inventory.rerun(ofPerson(person, params))
    if (opened.kind === 'RUNNING') throw new Failure('INVENTORY_RUNNING')
    return answer({ started: true as const })
  })
}

function ofPerson(person: Person, params: { companyId: CompanyId; connectionId: ConnectionId }) {
  return { ...params, personId: person.id }
}
