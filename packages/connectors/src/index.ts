import { hubspot } from './hubspot/definition.ts'
import type { Connector } from './kernel/definition.ts'
import { ConnectorId } from './kernel/definition.ts'
import { mercadoLivre } from './mercado-livre/definition.ts'
import { sankhya } from './sankhya/definition.ts'

/** The catalog the Hub lists (one owner, C26). */
export const CONNECTORS: readonly Connector[] = [sankhya, mercadoLivre, hubspot]

export function connectorOf(id: string): Connector | undefined {
  const parsed = ConnectorId.safeParse(id)
  return parsed.success ? CONNECTORS.find((connector) => connector.id === parsed.data) : undefined
}

export { hubspotFake } from './hubspot/fake.ts'
export {
  type Auth,
  type ClientCredentialsAuth,
  type Credential,
  loggedOutBy,
  logoutRequest,
  readToken,
  tokenRequest,
} from './kernel/auth.ts'
export type { CredentialFake, Fake, OAuthFake } from './kernel/conformance-session.ts'
export { CredentialClass } from './kernel/credential-class.ts'
export type { Connector, ConnectorId, ConnectorSkill, ReadDoor } from './kernel/definition.ts'
export { toolNameOf } from './kernel/definition.ts'
export { type Numbers, parseExact, parseJson } from './kernel/exact-json.ts'
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
  Instant,
  listInputNames,
  locateOf,
  requestOf,
} from './kernel/operation.ts'
export { toRequest } from './kernel/request.ts'
export { CONCURRENT_CALL, Rows } from './kernel/rows.ts'
export {
  credentialsSource,
  type Grant,
  type LoggedOut,
  type LoginRefused,
  type NeedsReauth,
  openSession,
  type ProviderSend,
  RENEW_BEFORE_MS,
  type Session,
  sessionOf,
  type TokenSource,
} from './kernel/session.ts'
export { connectorSkill, type SkillTable } from './kernel/skill.ts'
export {
  type ConnectorTables,
  DiscoveredTable,
  lakeNameOf,
  SourceColumn,
  SourceTable,
  sourceOf,
  startDateLimits,
  suggestedLakeName,
  TABLE_PAGE_DEFAULT,
  TABLE_SOURCE_FAILURES,
  TableColumn,
  TableColumnType,
  type TableDeclaration,
  TableFilter,
  type TableMode,
  TableName,
  TablePosition,
  type TableReadFailed,
  type TableSendFailure,
  type TableSource,
  type TableSourceFailure,
  tablePrefixOf,
} from './kernel/tables.ts'
export {
  type TablePageRead,
  type TableReach,
  type TableStop,
  tableFailureOf,
} from './kernel/tables-call.ts'
export {
  DISCOVERED_TYPES,
  type ExpectedTable,
  HUBSPOT_DISCOVERY,
  SANKHYA_DISCOVERY,
} from './kernel/tables-fixture.ts'
export { discoverTables, readTablePage, tableMonths } from './kernel/tables-read.ts'
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
export { SEARCH_PAGE_ROWS } from './sankhya/search.ts'
