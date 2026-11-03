import { listAgents, listAutomations } from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { ok } from './layout-harness.ts'

/** What the rail's Automações and Agentes links preload, so every company page answers both. */
export function railListsPage(id: string): Replies {
  return {
    [`GET /api/companies/${id}/agents`]: ok(listAgents, { agents: [] }),
    [`GET /api/companies/${id}/automations`]: ok(listAutomations, { automations: [] }),
  }
}
