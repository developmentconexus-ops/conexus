import { listAppTables, listProjectConnections } from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { ok } from './layout-harness.ts'

/** What the rail's Integrações and Dados links preload: what the Projeto may read, and its app's tables, no app built yet. */
export function projectPreloadsPage(id: string, projectId: string): Replies {
  const path = `/api/companies/${id}/projects/${projectId}`
  return {
    [`GET ${path}/connections`]: ok(listProjectConnections, { connectors: [] }),
    [`GET ${path}/tables`]: ok(listAppTables, { kind: 'NO_APP', copies: [] }),
  }
}
