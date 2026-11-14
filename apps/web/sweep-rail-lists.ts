import { getOntology, listAgents, listAutomations, listCopies } from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { ok } from './layout-harness.ts'

/** What the rail's Automações, Agentes, Cópias and Conhecimento links preload, so every company page answers the four. */
export function railListsPage(id: string): Replies {
  return {
    [`GET /api/companies/${id}/agents`]: ok(listAgents, { agents: [] }),
    [`GET /api/companies/${id}/automations`]: ok(listAutomations, { automations: [] }),
    [`GET /api/companies/${id}/copies`]: ok(listCopies, { copies: [], proposals: [] }),
    [`GET /api/companies/${id}/ontology`]: ok(getOntology, {
      ...{ revision: null, concepts: [], toReview: 0, mayApprove: false, awaits: null },
    }),
  }
}
