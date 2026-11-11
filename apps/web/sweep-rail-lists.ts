import { listAgents, listAutomations, listCopies } from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { ok } from './layout-harness.ts'

/** What the rail's Automações, Agentes and Cópias links preload, so every company page answers the three. */
export function railListsPage(id: string): Replies {
  return {
    [`GET /api/companies/${id}/agents`]: ok(listAgents, { agents: [] }),
    [`GET /api/companies/${id}/automations`]: ok(listAutomations, { automations: [] }),
    [`GET /api/companies/${id}/copies`]: ok(listCopies, { copies: [], proposals: [] }),
  }
}
