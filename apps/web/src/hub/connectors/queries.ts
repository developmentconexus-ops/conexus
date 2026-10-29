import type { CompanyId } from '@conexus/hub-api'
import { linkConnection, listConnections, testConnection, unlinkConnection } from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

export function connectionsQuery(companyId: CompanyId) {
  return hubQuery(listConnections, { params: { companyId } })
}

export const sendLink = hubMutation(linkConnection)
/**
 * The Hub spends up to 80 s on one Testar (apps/server/src/hub/connectors/public.ts) and answers
 * before the 100 s at which Cloudflare's edge cuts it; the browser waits between the two.
 */
const TEST_WAIT_MS = 95_000

export const sendTest = hubMutation(testConnection, { deadlineMs: TEST_WAIT_MS })
export const sendUnlink = hubMutation(unlinkConnection)
