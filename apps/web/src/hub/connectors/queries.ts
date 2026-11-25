import type { CompanyId, ConnectionId, ProjectId } from '@conexus/hub-api'
import {
  answerConnectionLink,
  completeConnectionSignIn,
  createConnectionLink,
  deleteConnectionNote,
  getConnection,
  grantProjectConnection,
  linkConnection,
  listConnections,
  listProjectConnections,
  readConnectionLink,
  reconnectConnection,
  revokeProjectConnection,
  startConnectionSignIn,
  TEST_LONGEST_MS,
  testConnection,
  unlinkConnection,
} from '@conexus/hub-api'
import { hubMutation, hubQuery, hubQueryPrefix } from '../../platform/hub.ts'

/** The 100 s at which Cloudflare's edge cuts any answer (apps/server/src/platform/http.ts). */
export const EDGE_CUT_MS = 100_000
/** What the browser adds to the longest a Testar takes: the round trip and the Hub's own reads. */
const TEST_WAIT_MARGIN_MS = 10_000
export const TEST_WAIT_MS = TEST_LONGEST_MS + TEST_WAIT_MARGIN_MS

export function connectionsQuery(companyId: CompanyId) {
  return hubQuery(listConnections, { params: { companyId } })
}

export function connectionQuery(companyId: CompanyId, connectionId: ConnectionId) {
  return hubQuery(getConnection, { params: { companyId, connectionId } })
}

/** The list's reads, what a Ligar or a Desligar makes stale. */
export function connectionsPrefix(companyId: CompanyId) {
  return hubQueryPrefix(listConnections, { companyId })
}

/** The reads of one connection and of the list: what a Testar makes stale. */
export function connectionKeys(companyId: CompanyId, connectionId: ConnectionId) {
  return [connectionsPrefix(companyId), hubQueryPrefix(getConnection, { companyId, connectionId })]
}

export const sendLink = hubMutation(linkConnection)
export const sendTest = hubMutation(testConnection, { deadlineMs: TEST_WAIT_MS })
export const sendUnlink = hubMutation(unlinkConnection)
export const sendSignInStart = hubMutation(startConnectionSignIn)
export const sendSignInEnd = hubMutation(completeConnectionSignIn)
export const sendReconnect = hubMutation(reconnectConnection)

export function projectConnectionsQuery(companyId: CompanyId, projectId: ProjectId) {
  return hubQuery(listProjectConnections, { params: { companyId, projectId } })
}

/** The Projeto's list of what it may read: what a Liberar or a Tirar makes stale. */
export function projectConnectionsKey(companyId: CompanyId, projectId: ProjectId) {
  return hubQueryPrefix(listProjectConnections, { companyId, projectId })
}

export const sendGrant = hubMutation(grantProjectConnection)
export const sendRevoke = hubMutation(revokeProjectConnection)
export const sendNoteDeletion = hubMutation(deleteConnectionNote)
export const sendConnectionLink = hubMutation(createConnectionLink)

/** The page of a link by its secret, read with no session. */
export function connectionLinkQuery(secret: string) {
  return hubQuery(readConnectionLink, { params: { secret } })
}

export const sendLinkAnswer = hubMutation(answerConnectionLink)
