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
export type { CredentialFake, Fake, OAuthFake } from './kernel/conformance-session.ts'
export type {
  ConnectorCopy,
  CopyColumnType,
  CopyColumnTypeV2,
  CopyModel,
  CopyPage,
} from './kernel/copy.ts'
export {
  CANONICAL_CELL,
  CopyDefinition,
  CopyDefinitionV1,
  CopyDefinitionV2,
  CopyName,
  CopyPageSchema,
  CopyPosition,
  PAGE_ROWS,
  PageInput,
} from './kernel/copy.ts'
export type { Connector, ConnectorId, ReadDoor } from './kernel/definition.ts'
export type { ListPage } from './kernel/list.ts'
export { listInputOf, listPageOf } from './kernel/list.ts'
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
  ListPaging,
  ListRead,
  Native,
  Operation,
  OperationClass,
  OperationId,
  ProviderAnswer,
  ProviderRequest,
  Unread,
  WriteOperation,
} from './kernel/operation.ts'
export {
  AccountRef,
  deniesAccess,
  listInputNames,
  locateOf,
  requestOf,
} from './kernel/operation.ts'
export { PERSONAL_KINDS, type PersonalKind } from './kernel/personal.ts'
export { toRequest } from './kernel/request.ts'
export { CONCURRENT_CALL, Rows } from './kernel/rows.ts'
export { mercadoLivreFake } from './mercado-livre/fake.ts'
export { MERCADO_LIVRE_FACTS } from './mercado-livre/fake-facts.ts'
export { sankhyaFake } from './sankhya/fake.ts'
export type { SalesSet } from './sankhya/fake-sales.ts'
export {
  changedOn,
  PADARIA_SOL_FILIAL,
  PADARIA_SOL_MATRIZ,
  salesDatabase,
  soldBy,
} from './sankhya/fake-sales.ts'
