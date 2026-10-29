import type { CompanyId } from '@conexus/hub-api'
import {
  linkConnection,
  listConnections,
  TEST_CONNECTION_DEADLINE_MS,
  testConnection,
  unlinkConnection,
} from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

export function connectionsQuery(companyId: CompanyId) {
  return hubQuery(listConnections, { params: { companyId } })
}

export const sendLink = hubMutation(linkConnection)
export const sendTest = hubMutation(testConnection, { deadlineMs: TEST_CONNECTION_DEADLINE_MS })
export const sendUnlink = hubMutation(unlinkConnection)
