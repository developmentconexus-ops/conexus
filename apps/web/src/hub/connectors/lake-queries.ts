import type { CompanyId, ConnectionId } from '@conexus/hub-api'
import { getLakeTablesOfConnection, runLakeCopy, setLakeCopy } from '@conexus/hub-api'
import { hubMutation, hubQuery, hubQueryPrefix } from '../../platform/hub.ts'

export function lakeTablesQuery(companyId: CompanyId, connectionId: ConnectionId) {
  return hubQuery(getLakeTablesOfConnection, { params: { companyId, connectionId } })
}

/** The reads of one connection's tables: what a Salvar, a Rodar agora or the end of a round makes stale. */
export function lakeTablesPrefix(companyId: CompanyId, connectionId: ConnectionId) {
  return hubQueryPrefix(getLakeTablesOfConnection, { companyId, connectionId })
}

export const sendLakeCopy = hubMutation(setLakeCopy)
export const sendLakeRun = hubMutation(runLakeCopy)
