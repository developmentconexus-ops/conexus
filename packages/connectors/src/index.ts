import type { Connector } from './kernel/definition.ts'
import { ConnectorId } from './kernel/definition.ts'
import { mercadoLivre } from './mercado-livre/definition.ts'
import { sankhya } from './sankhya/definition.ts'

/** The catalog the Hub lists (one owner, C26). */
export const CONNECTORS: readonly Connector[] = [sankhya, mercadoLivre]

export function connectorOf(id: string): Connector | undefined {
  const parsed = ConnectorId.safeParse(id)
  return parsed.success ? CONNECTORS.find((connector) => connector.id === parsed.data) : undefined
}

export {
  type Auth,
  type ClientCredentialsAuth,
  loggedOutBy,
  logoutRequest,
  readToken,
  tokenRequest,
} from './kernel/auth.ts'
export type { CredentialFake, Fake, OAuthFake } from './kernel/conformance.ts'
export type { Connector, ConnectorId, ReadDoor } from './kernel/definition.ts'
export {
  type AppKeys,
  type AppSource,
  authorizeUrl,
  codeRequest,
  type GrantAnswered,
  type OAuth2CodeAuth,
  readGrant,
  refreshRequest,
  revokeRequest,
} from './kernel/oauth.ts'
export type {
  Account,
  AccountOf,
  Answered,
  Native,
  Operation,
  OperationClass,
  OperationId,
  ProviderAnswer,
  ProviderRequest,
  Unread,
} from './kernel/operation.ts'
export { AccountRef, deniesAccess, locateOf, requestOf } from './kernel/operation.ts'
export { toRequest } from './kernel/request.ts'
export { CONCURRENT_CALL } from './kernel/rows.ts'
export { mercadoLivreFake } from './mercado-livre/fake.ts'
export { sankhyaFake } from './sankhya/fake.ts'
export type { SalesSet } from './sankhya/fake-sales.ts'
export {
  PADARIA_SOL_FILIAL,
  PADARIA_SOL_MATRIZ,
  salesDatabase,
  soldBy,
} from './sankhya/fake-sales.ts'
