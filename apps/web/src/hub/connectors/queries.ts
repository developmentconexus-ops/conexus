import type { CompanyId } from '@conexus/hub-api'
import { linkConnection, listConnections, testConnection, unlinkConnection } from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

export function connectionsQuery(companyId: CompanyId) {
  return hubQuery(listConnections, { params: { companyId } })
}

export const sendLink = hubMutation(linkConnection)
export const sendTest = hubMutation(testConnection)
export const sendUnlink = hubMutation(unlinkConnection)
