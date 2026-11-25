import { z } from 'zod'
import { ConnectorId } from './company-roles.ts'
import { ConnectionId, Native, OfferedRead, OperationEffect } from './connectors.ts'
import { ConversationId } from './conversations.ts'
import { ToolCallId } from './questions.ts'
import { OperationId } from './tools.ts'

/**
 * The access contract between the data track and the agents and apps (founder's decision 2A, catalog
 * first and the Ontologia on top): three verbs, the same for the Assistant, the Builder, the
 * company's agents and the published apps. The data track implements `DataSources` over the one
 * executor and the write funnel; a consumer receives a `CompanyData` already bound to
 * who asks and where, and never chooses where a read is served from.
 */

const OperationEntry = OfferedRead.omit({ allowed: true })

/** One connected system and what it does live: its reads and its actions, as the kit or the provider's catalog declares them. */
export const CatalogSystem = z.object({
  connection: ConnectionId,
  connector: ConnectorId,
  name: z.string(),
  reads: z.array(OperationEntry),
  /** An action the provider declares without an effect counts as a write, so it asks before it runs (D1). */
  actions: z.array(OperationEntry.extend({ effect: OperationEffect.exclude(['READ']) })),
})
export type CatalogSystem = z.infer<typeof CatalogSystem>

const CatalogUnavailable = z.object({ kind: z.literal('CATALOG_UNAVAILABLE') })

/** What the place may use, assembled by the platform from the connections. */
export const Catalog = z.object({ kind: z.literal('CATALOG'), systems: z.array(CatalogSystem) })
export type Catalog = z.infer<typeof Catalog>

/** Describe: the catalog, or the Hub's database did not answer. */
export const Described = z.discriminatedUnion('kind', [Catalog, CatalogUnavailable])
export type Described = z.infer<typeof Described>

/** The same ceiling as app_data_read (apps/server/src/harness/tools/app-data/tools.ts:12). */
export const QUERY_SQL_MAX = 4000

/** Read: one table by name, one read of a system, or a read-only query over the catalog's tables; the catalog lists no table, so a table and a query are outside it. */
export const ReadRequest = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('TABLE'), table: z.string() }),
  z.object({
    kind: z.literal('OPERATION'),
    connection: ConnectionId,
    operation: OperationId,
    input: z.unknown(),
  }),
  z.object({ kind: z.literal('QUERY'), sql: z.string().trim().min(1).max(QUERY_SQL_MAX) }),
])
export type ReadRequest = z.infer<typeof ReadRequest>
type OperationRead = Omit<Extract<ReadRequest, { kind: 'OPERATION' }>, 'kind'>

/** The system's refusals, whole (code C79), and the Hub's own before it called. */
const REFUSALS = [
  z.object({
    kind: z.enum(['REFUSED', 'AUTH_REFUSED', 'TOKEN_EXPIRED', 'UNREADABLE']),
    native: Native,
  }),
  z.object({ kind: z.literal('BUSY'), waitMs: z.int().nonnegative().nullable() }),
  z.object({ kind: z.enum(['UNREACHABLE', 'DEADLINE']) }),
  z.object({ kind: z.enum(['NOT_GRANTED', 'NOT_IN_ROLE', 'CALLS_SPENT']) }),
] as const

const NotInCatalog = z.object({ kind: z.literal('NOT_IN_CATALOG') })

export const ReadAnswer = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('LIVE'),
    at: z.iso.datetime(),
    value: z.unknown(),
    empty: z.literal(true).optional(),
  }),
  /** The read's record was not written: nothing it brought returns. */
  z.object({ kind: z.literal('TABLE_UNAVAILABLE') }),
  NotInCatalog,
  CatalogUnavailable,
  ...REFUSALS,
])
export type ReadAnswer = z.infer<typeof ReadAnswer>

/** Act: one action of a system, named by the conversation's call so a repeat is found and never sent. */
export const ActRequest = z.object({
  connection: ConnectionId,
  operation: OperationId,
  input: z.unknown(),
  call: z.object({ thread: ConversationId, toolCall: ToolCallId }),
})
export type ActRequest = z.infer<typeof ActRequest>

const Returned = z.object({ status: z.int(), body: z.unknown() }).nullable()

/** The funnel's answer: `mark` is what the person looks for in the system when the end is not known. */
export const ActAnswer = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('OK'), value: z.unknown(), returned: Returned }),
  z.object({ kind: z.literal('WRITE_UNCERTAIN'), mark: z.string(), returned: Returned }),
  z.object({ kind: z.literal('IDEMPOTENCY_CONFLICT'), mark: z.string() }),
  z.object({ kind: z.literal('WRITE_OPEN'), mark: z.string(), since: z.iso.datetime() }),
  NotInCatalog,
  CatalogUnavailable,
  ...REFUSALS,
])
export type ActAnswer = z.infer<typeof ActAnswer>

type Signal = Readonly<{ signal?: AbortSignal }>
type CatalogOnly = 'NOT_IN_CATALOG' | 'CATALOG_UNAVAILABLE'
type LiveAnswer =
  | Readonly<{ kind: 'OK'; value: unknown; empty?: true }>
  | Exclude<ReadAnswer, { kind: 'LIVE' | 'TABLE_UNAVAILABLE' | CatalogOnly }>

/** What the data track gives the contract, already bound to who asks and where. */
export type DataSources = Readonly<{
  /** The systems the place may use, released ones only. */
  catalog(a: Signal): Promise<Described>
  /** One read of a system now, through the executor, whatever logs in beneath it. */
  live(a: Signal & OperationRead): Promise<LiveAnswer>
  /** One write through the funnel, which records it and asks with the approval card; who approved it is bound here by the card's path, never carried by the request. */
  funnel(a: Signal & ActRequest): Promise<Exclude<ActAnswer, { kind: CatalogOnly }>>
}>

export type CompanyData = Readonly<{
  describe(a?: Signal): Promise<Described>
  read(request: ReadRequest & Signal): Promise<ReadAnswer>
  act(request: ActRequest & Signal): Promise<ActAnswer>
}>

const NOT_IN_CATALOG = { kind: 'NOT_IN_CATALOG' } as const

function declaresRead(catalog: Catalog, read: OperationRead): boolean {
  const system = catalog.systems.find(({ connection }) => connection === read.connection)
  return system?.reads.some(({ operation }) => operation === read.operation) === true
}

function declaresAction(catalog: Catalog, request: ActRequest): boolean {
  const system = catalog.systems.find(({ connection }) => connection === request.connection)
  return system?.actions.some(({ operation }) => operation === request.operation) === true
}

export function companyData(a: Readonly<{ sources: DataSources; now: () => Date }>): CompanyData {
  const { sources, now } = a
  return {
    describe: (options) => sources.catalog({ signal: options?.signal }),

    async read(request) {
      const { signal } = request
      const catalog = await sources.catalog({ signal })
      if (catalog.kind === 'CATALOG_UNAVAILABLE') return catalog
      if (request.kind !== 'OPERATION') return NOT_IN_CATALOG
      const read = {
        connection: request.connection,
        operation: request.operation,
        input: request.input,
      }
      if (!declaresRead(catalog, read)) return NOT_IN_CATALOG
      const at = now().toISOString()
      const answered = await sources.live({ ...read, signal })
      return answered.kind === 'OK' ? { ...answered, kind: 'LIVE', at } : answered
    },

    async act(request) {
      const catalog = await sources.catalog({ signal: request.signal })
      if (catalog.kind === 'CATALOG_UNAVAILABLE') return catalog
      return declaresAction(catalog, request) ? sources.funnel(request) : NOT_IN_CATALOG
    },
  }
}
