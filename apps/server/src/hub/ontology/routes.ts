import type { CompanyId, ConnectionId, Person } from '@conexus/hub-api'
import {
  decideOntologyProposal,
  getInventory,
  getOntology,
  getOntologyConcept,
  listOntologyProposals,
  listOntologyRevisions,
  runInventory,
  suggestConcepts as suggestOperation,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { decideProposal } from './decide.ts'
import type { InventoryService } from './inventory-service.ts'
import { conceptPage, ontologyView, proposalsView, revisionsView } from './reads.ts'
import { suggestConcepts } from './suggest.ts'

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

type ConceptDeps = Readonly<{ database: Database; identity: IdentityPorts; log: FailureLog }>

/** Conhecimento's routes: the four reads every member makes, the suggestion and the decision. */
export function registerConceptRoutes(app: FastifyInstance, deps: ConceptDeps): void {
  serve(app, getOntology, async ({ person, params }) =>
    answer(await ontologyView(deps, { ...params, personId: person.id })),
  )
  serve(app, getOntologyConcept, async ({ person, params }) =>
    answer(await conceptPage(deps, { ...params, personId: person.id })),
  )
  serve(app, listOntologyProposals, async ({ person, params, query }) =>
    answer({
      proposals: await proposalsView(deps, { ...params, ...query, personId: person.id }),
    }),
  )
  serve(app, listOntologyRevisions, async ({ person, params }) =>
    answer({ revisions: await revisionsView(deps, { ...params, personId: person.id }) }),
  )
  serve(app, suggestOperation, async ({ person, params, body, attemptKey }) => {
    const input = { ...params, personId: person.id, attemptKey, suggestion: body }
    return answer({ proposalId: await suggestConcepts(deps, input) })
  })
  serve(app, decideOntologyProposal, async ({ person, params, body }) =>
    answer(await decideProposal(deps, { ...params, personId: person.id, decision: body })),
  )
}
