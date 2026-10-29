import type { CompanyId } from '@conexus/hub-api'
import {
  linkConnection,
  listConnections,
  TEST_DEADLINE_MS,
  testConnection,
  unlinkConnection,
} from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

/** The 100 s at which Cloudflare's edge cuts any answer (apps/server/src/platform/http.ts). */
export const EDGE_CUT_MS = 100_000
/** What the browser adds to the Hub's Testar deadline: the round trip and the reads outside it. */
const TEST_WAIT_MARGIN_MS = 10_000
export const TEST_WAIT_MS = TEST_DEADLINE_MS + TEST_WAIT_MARGIN_MS

export function connectionsQuery(companyId: CompanyId) {
  return hubQuery(listConnections, { params: { companyId } })
}

export const sendLink = hubMutation(linkConnection)
export const sendTest = hubMutation(testConnection, { deadlineMs: TEST_WAIT_MS })
export const sendUnlink = hubMutation(unlinkConnection)
