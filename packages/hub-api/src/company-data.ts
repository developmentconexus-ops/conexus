import { z } from 'zod'
import { ConnectorId } from './company-roles.ts'
import {
  CONNECTION_STATES,
  ConnectionId,
  Native,
  OfferedRead,
  OperationEffect,
} from './connectors.ts'
import { ConversationId } from './conversations.ts'
import { CopyRun } from './copies.ts'
import { CopyOrigin, CopyShown, CopySource } from './copy-shown.ts'
import { ToolCallId } from './questions.ts'
import { OperationId } from './tools.ts'

/**
 * The access contract between the data track and the agents and apps (founder's decision 2A, catalog
 * first and the Ontologia on top): three verbs, the same for the Assistant, the Builder, the
 * company's agents and the published apps. The data track implements `DataSources` over the one
 * executor, the tables and the write funnel; a consumer receives a `CompanyData` already bound to
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

/** One connection a table was copied from, as the place that reads it may name it. */
export const KeptSource = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('NAMED'),
    connection: CopySource.shape.connection,
    state: z.enum(CONNECTION_STATES),
  }),
  z.object({ kind: z.literal('NOT_GIVEN'), connector: ConnectorId }),
])
export type KeptSource = z.infer<typeof KeptSource>

/** Who keeps a table's rows: today a copy in the company's database, `sync.<name>`, with its last run. */
const TableKept = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('COPY'),
    sources: z.array(KeptSource).min(1),
    source: CopyOrigin,
    /** The last run that ended, with whether it was partial; null before the first. */
    lastRun: CopyRun.nullable(),
  }),
])

/** The rows one read of a table carries at most: what the consumer gets in place of the live read. */
export const TABLE_PAGE_ROWS = 200

/** One table the place may read: what it holds, what each column means, and who keeps it. */
export const CatalogTable = z.object({
  name: z.string(),
  label: z.string(),
  /** Required: the agent picks the table by it. */
  description: z.string().min(1),
  columns: CopyShown.shape.columns,
  kept: TableKept,
})
export type CatalogTable = z.infer<typeof CatalogTable>

const CatalogUnavailable = z.object({ kind: z.literal('CATALOG_UNAVAILABLE') })

/** What the place may use, assembled by the platform from the connections and the tables. */
export const Catalog = z.object({
  kind: z.literal('CATALOG'),
  systems: z.array(CatalogSystem),
  /** The tables the asker's role reads; a table outside it is not named anywhere. */
  tables: z.array(CatalogTable),
})
export type Catalog = z.infer<typeof Catalog>

/** Describe: the catalog, or the Hub's database did not answer. */
export const Described = z.discriminatedUnion('kind', [Catalog, CatalogUnavailable])
export type Described = z.infer<typeof Described>

/** The rows one query carries at most. */
export const QUERY_ROWS = 200
/** The same ceiling as app_data_read (apps/server/src/builder/app-data/tools.ts:12). */
export const QUERY_SQL_MAX = 4000

/** Read: one table by name, one read of a system, which the catalog serves from a table when one keeps it, or a read-only query over the catalog's tables. */
export const ReadRequest = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('TABLE'), table: z.string() }),
  z.object({
    kind: z.literal('OPERATION'),
    connection: ConnectionId,
    operation: OperationId,
    input: z.unknown(),
  }),
  /** A read-only query over the catalog's tables. The database refuses what it must. */
  z.object({ kind: z.literal('QUERY'), sql: z.string().trim().min(1).max(QUERY_SQL_MAX) }),
])
export type ReadRequest = z.infer<typeof ReadRequest>
type OperationRead = Omit<Extract<ReadRequest, { kind: 'OPERATION' }>, 'kind'>
type TableOrOperation = Exclude<ReadRequest, { kind: 'QUERY' }>

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
    kind: z.literal('TABLE'),
    table: z.string(),
    kept: TableKept,
    rows: z.array(z.record(z.string(), z.unknown())),
    /** False when the table holds more rows than the page carries. */
    complete: z.boolean(),
  }),
  z.object({
    kind: z.literal('LIVE'),
    at: z.iso.datetime(),
    value: z.unknown(),
    empty: z.literal(true).optional(),
  }),
  /** Whoever keeps the table did not answer: the table is not read live in its place. */
  z.object({ kind: z.literal('TABLE_UNAVAILABLE') }),
  z.object({
    kind: z.literal('QUERY'),
    columns: z.array(z.string()),
    rows: z.array(z.array(z.unknown())),
    /** False when the query brought more rows than QUERY_ROWS. */
    complete: z.boolean(),
    /** The catalog's tables the query read, each with who keeps it and its last run. */
    tables: z.array(z.object({ table: z.string(), kept: TableKept })),
  }),
  /** The database refused the query: the SQLSTATE and PostgreSQL's whole message go to the model (code C79). */
  z.object({
    kind: z.literal('QUERY_REFUSED'),
    sqlstate: z.string().regex(/^[0-9A-Z]{5}$/),
    message: z.string(),
  }),
  z.object({ kind: z.literal('QUERY_TOO_LARGE') }),
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
type TableAnswer = Extract<ReadAnswer, { kind: 'TABLE' }>
type Page =
  | Readonly<{ kind: 'ROWS' } & Pick<TableAnswer, 'rows' | 'complete'>>
  | Extract<ReadAnswer, { kind: 'TABLE_UNAVAILABLE' }>
type LiveAnswer =
  | Readonly<{ kind: 'OK'; value: unknown; empty?: true }>
  | Exclude<
      ReadAnswer,
      {
        kind:
          | 'TABLE'
          | 'LIVE'
          | 'TABLE_UNAVAILABLE'
          | 'QUERY'
          | 'QUERY_REFUSED'
          | 'QUERY_TOO_LARGE'
          | CatalogOnly
      }
    >

/** What the query source gives back. NOT_IN_ROLE and DEADLINE sit in members with an enum (REFUSALS), and Extract would give never. */
export type QueryPage =
  | Readonly<{
      kind: 'ROWS'
      columns: string[]
      rows: unknown[][]
      complete: boolean
      used: readonly string[]
    }>
  | Extract<
      ReadAnswer,
      { kind: 'QUERY_REFUSED' | 'QUERY_TOO_LARGE' | 'TABLE_UNAVAILABLE' | 'NOT_IN_CATALOG' }
    >
  | Readonly<{ kind: 'NOT_IN_ROLE' }>
  | Readonly<{ kind: 'DEADLINE' }>

/** What the data track gives the contract, already bound to who asks and where. */
export type DataSources = Readonly<{
  /** The systems and tables the place may use, released ones only. */
  catalog(a: Signal): Promise<Described>
  /** One page of a table, from whoever keeps it. */
  rows(a: Signal & Readonly<{ table: CatalogTable }>): Promise<Page>
  /** One read of a system now, through the executor, whatever logs in beneath it. */
  live(a: Signal & OperationRead): Promise<LiveAnswer>
  /** The query as the read login of whoever asks, and the names of the sync tables it read. */
  query(a: Signal & Readonly<{ sql: string }>): Promise<QueryPage>
  /** One write through the funnel, which records it and asks with the approval card; who approved it is bound here by the card's path, never carried by the request. */
  funnel(a: Signal & ActRequest): Promise<Exclude<ActAnswer, { kind: CatalogOnly }>>
}>

export type CompanyData = Readonly<{
  describe(a?: Signal): Promise<Described>
  read(request: ReadRequest & Signal): Promise<ReadAnswer>
  act(request: ActRequest & Signal): Promise<ActAnswer>
}>

const NOT_IN_CATALOG = { kind: 'NOT_IN_CATALOG' } as const

function fixes(fixed: Readonly<Record<string, unknown>>, input: unknown): boolean {
  const given = input ?? {}
  if (typeof given !== 'object' || Array.isArray(given)) return false
  const entries = Object.entries(given)
  return (
    entries.length === Object.keys(fixed).length &&
    entries.every(([field, value]) => Object.hasOwn(fixed, field) && fixed[field] === value)
  )
}

function keeps(table: CatalogTable, read: OperationRead): boolean {
  const { kept } = table
  return (
    kept.source.kind === 'OPERATION' &&
    kept.source.operation === read.operation &&
    kept.sources.some((one) => one.kind === 'NAMED' && one.connection.id === read.connection) &&
    fixes(kept.source.input, read.input)
  )
}

type Source =
  | Readonly<{ kind: 'TABLE'; table: CatalogTable }>
  | Readonly<{ kind: 'LIVE'; read: OperationRead }>
  | typeof NOT_IN_CATALOG

function sourceOf(catalog: Catalog, request: TableOrOperation): Source {
  if (request.kind === 'TABLE') {
    const table = catalog.tables.find(({ name }) => name === request.table)
    return table === undefined ? NOT_IN_CATALOG : { kind: 'TABLE', table }
  }
  const read = {
    connection: request.connection,
    operation: request.operation,
    input: request.input,
  }
  const system = catalog.systems.find(({ connection }) => connection === read.connection)
  if (system?.reads.some(({ operation }) => operation === read.operation) !== true)
    return NOT_IN_CATALOG
  const table = catalog.tables.find((one) => keeps(one, read))
  return table === undefined ? { kind: 'LIVE', read } : { kind: 'TABLE', table }
}

function declaresAction(catalog: Catalog, request: ActRequest): boolean {
  const system = catalog.systems.find(({ connection }) => connection === request.connection)
  return system?.actions.some(({ operation }) => operation === request.operation) === true
}

async function queried(
  sources: DataSources,
  catalog: Catalog,
  request: Signal & Readonly<{ sql: string }>,
): Promise<ReadAnswer> {
  const answered = await sources.query(request)
  if (answered.kind !== 'ROWS') return answered
  const tables = answered.used.map((name) => catalog.tables.find((one) => one.name === name))
  // A table read outside the asker's catalog: no row leaves.
  if (tables.some((one) => one === undefined)) return NOT_IN_CATALOG
  const { columns, rows, complete } = answered
  return {
    kind: 'QUERY',
    columns,
    rows,
    complete,
    tables: tables.flatMap((one) =>
      one === undefined ? [] : [{ table: one.name, kept: one.kept }],
    ),
  }
}

export function companyData(a: Readonly<{ sources: DataSources; now: () => Date }>): CompanyData {
  const { sources, now } = a
  return {
    describe: (options) => sources.catalog({ signal: options?.signal }),

    async read(request) {
      const { signal } = request
      const catalog = await sources.catalog({ signal })
      if (catalog.kind === 'CATALOG_UNAVAILABLE') return catalog
      if (request.kind === 'QUERY') return queried(sources, catalog, { sql: request.sql, signal })
      const source = sourceOf(catalog, request)
      switch (source.kind) {
        case 'NOT_IN_CATALOG':
          return source
        case 'TABLE': {
          const { table } = source
          const page = await sources.rows({ table, signal })
          if (page.kind === 'TABLE_UNAVAILABLE') return page
          const { rows, complete } = page
          return { kind: 'TABLE', table: table.name, kept: table.kept, rows, complete }
        }
        case 'LIVE': {
          const at = now().toISOString()
          const answered = await sources.live({ ...source.read, signal })
          return answered.kind === 'OK' ? { ...answered, kind: 'LIVE', at } : answered
        }
        default:
          return source satisfies never
      }
    },

    async act(request) {
      const catalog = await sources.catalog({ signal: request.signal })
      if (catalog.kind === 'CATALOG_UNAVAILABLE') return catalog
      return declaresAction(catalog, request) ? sources.funnel(request) : NOT_IN_CATALOG
    },
  }
}
