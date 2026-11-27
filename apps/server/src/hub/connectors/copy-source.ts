import type {
  AccountRef,
  Connector,
  TableDeclaration,
  TableMode,
  TreatedTable,
} from '@conexus/connectors'
import {
  discoverTables,
  LakeTableName as KitLakeTableName,
  sourceOf,
  startDateLimits,
  suggestedLakeName,
  TableName,
  tablePrefixOf,
  treatedSelect,
} from '@conexus/connectors'
import type { CompanyId, ConnectionId, ConnectorId, LakeUnavailable } from '@conexus/hub-api'
import { LAKE_TABLE_NAME_PATTERN } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { OpenedConnection } from './executor.ts'
import { valuesOf } from './executor.ts'
import type { Deps } from './rows.ts'
import { connectorIn } from './rows.ts'
import { connection } from './tables.ts'
import { openedIn } from './testing.ts'

type Where = Readonly<{ companyId: CompanyId; connectionId: ConnectionId }>

/** What one round's spec needs of its connection: the opened fields (S8). */
type CopyOpened =
  | Readonly<{
      kind: 'OPENED'
      connector: ConnectorId
      account: AccountRef | null
      credential: Readonly<Record<string, string>>
    }>
  | Readonly<{ kind: 'GONE' }>

/** A column of the dictionary, as the lake keeps it. */
export type CopyColumn = Readonly<{ name: string; type: string; description: string | null }>

/** The dictionary's columns of each declared table it answered, by source; a table it did not answer is absent. */
type CopyColumns =
  | Readonly<{ kind: 'READ'; columns: ReadonlyMap<string, readonly CopyColumn[]> }>
  | Readonly<{ kind: 'UNAVAILABLE' }>

/** How a table is read, as the contract shows it. */
type CopyMode =
  | Readonly<{ kind: 'CHANGED'; column: string; registry: boolean }>
  | Readonly<{ kind: 'WINDOW'; column: string }>
  | Readonly<{ kind: 'FULL' }>

/** One table the kit declares for the connection's connector, in the Hub's plain words. */
export type CopyTable = Readonly<{
  source: string
  /** The kit's name of the table, the part after the connector's prefix. */
  name: string
  label: string
  description: string
  group: string
  mode: CopyMode
  /** Whether the start date limits it (`startDateLimits`). */
  limited: boolean
}>

/** The connection a copy is marked on: its connector, name and declared tables, or gone (or of a connector the catalog lacks). */
export type CopyConnection =
  | Readonly<{
      kind: 'FOUND'
      connector: ConnectorId
      name: string
      unavailable: LakeUnavailable | null
      tables: readonly CopyTable[]
    }>
  | Readonly<{ kind: 'GONE' }>

type TreatedTemplate = TreatedTable & Readonly<{ label: string; select(lakeName: string): string }>

export type CopySource = {
  treatedLookup(
    tx: ReadTx,
    companyId: CompanyId,
  ): Promise<
    (table: Readonly<{ connectionId: ConnectionId; source: string }>) => TreatedTemplate | null
  >
  connection(at: Where): Promise<CopyConnection>
  open(at: Where): Promise<CopyOpened>
  columns(at: Where): Promise<CopyColumns>
  /** A name is the connector's prefix and a part after it, inside the contract's pattern (T.16). */
  nameIsValid(connector: ConnectorId, name: string): boolean
  /** The kit's suggestion for a table, with the connection's name when the plain one is taken (T.16). */
  suggestedName(
    input: Readonly<{
      connector: ConnectorId
      table: CopyTable
      connectionName: string
      taken: (name: string) => boolean
    }>,
  ): string
}

function modeOf(mode: TableMode): CopyMode {
  switch (mode.kind) {
    case 'CHANGED':
      return { kind: 'CHANGED', column: mode.column, registry: mode.registry }
    case 'WINDOW':
      return { kind: 'WINDOW', column: mode.column }
    case 'FULL':
      return { kind: 'FULL' }
    default:
      return mode satisfies never
  }
}

function tableOf(declaration: TableDeclaration): CopyTable {
  return {
    source: sourceOf(declaration),
    name: declaration.name,
    label: declaration.label,
    description: declaration.description,
    group: declaration.group,
    mode: modeOf(declaration.mode),
    limited: startDateLimits(declaration.mode),
  }
}

function readsFor(tables: NonNullable<Connector['tables']>): number {
  const login = 1
  const batches = Math.ceil(tables.declared.length / (tables.discover?.tables ?? 1))
  return login + batches
}

/** Why the lake is not offered for a connector, or null: the one rule, read by the catalog and by the copy. */
export function unavailableFor(connector: Connector): LakeUnavailable | null {
  if (connector.auth.credentialClass === 'EXCLUSIVE') return 'EXCLUSIVE_CREDENTIAL'
  if ((connector.tables?.declared ?? []).length === 0) return 'NO_TABLES'
  return null
}

function nameIsValid(connector: ConnectorId, name: string): boolean {
  const prefix = tablePrefixOf(connector)
  return (
    name.startsWith(prefix) && name.length > prefix.length && LAKE_TABLE_NAME_PATTERN.test(name)
  )
}

async function treatedLookupIn(
  deps: Deps,
  tx: ReadTx,
  companyId: CompanyId,
): ReturnType<CopySource['treatedLookup']> {
  const rows = await tx
    .select({ id: connection.id, connector: connection.connectorId })
    .from(connection)
    .where(eq(connection.companyId, companyId))
  const connectors = new Map(rows.map((row) => [row.id, row.connector]))
  return ({ connectionId, source }) => {
    const id = connectors.get(connectionId)
    const declared = id === undefined ? [] : (connectorIn(deps, id)?.tables?.declared ?? [])
    const found = declared.find((each) => sourceOf(each) === source)
    const treated = found?.treated
    if (found === undefined || treated === undefined) return null
    return {
      ...treated,
      label: found.label,
      select: (lakeName) => treatedSelect(KitLakeTableName.parse(lakeName), treated),
    }
  }
}

/**
 * The connection as the lake copy reads it (decision 0056: this subject alone opens a seal and
 * imports the kit), in a company scope with no person. The dictionary is the kit's one discovery
 * (`discoverTables`), on the connection's one session, as a live read is.
 */
export function createCopySource(deps: Deps): CopySource {
  async function opened(at: Where): Promise<OpenedConnection | null> {
    const scope = { kind: 'COMPANY', companyId: at.companyId, personId: null } as const
    try {
      return await deps.database.read(scope, (tx) => openedIn(deps, tx, at))
    } catch (error) {
      if (error instanceof Failure && error.code === 'CONNECTION_NOT_FOUND') return null
      throw error
    }
  }
  return {
    treatedLookup: (tx, companyId) => treatedLookupIn(deps, tx, companyId),
    async connection(at) {
      const scope = { kind: 'COMPANY', companyId: at.companyId, personId: null } as const
      const [row] = await deps.database.read(scope, (tx) =>
        tx
          .select({ connector: connection.connectorId, name: connection.name })
          .from(connection)
          .where(and(eq(connection.id, at.connectionId), eq(connection.companyId, at.companyId))),
      )
      const connector = row === undefined ? undefined : connectorIn(deps, row.connector)
      if (row === undefined || connector === undefined) return { kind: 'GONE' }
      return {
        kind: 'FOUND',
        connector: connector.id,
        name: row.name,
        unavailable: unavailableFor(connector),
        tables: (connector.tables?.declared ?? []).map(tableOf),
      }
    },
    nameIsValid,
    suggestedName: ({ connector, table, connectionName, taken }) =>
      suggestedLakeName({ connector, table: TableName.parse(table.name), connectionName, taken }),
    async open(at) {
      const found = await opened(at)
      if (found === null) return { kind: 'GONE' }
      const { connector } = found
      if (connector.auth.kind !== 'client_credentials')
        throw new Failure('SEAL_REFUSED', { details: { reason: 'not a pasted login' } })
      return {
        kind: 'OPENED',
        connector: connector.id,
        account: found.accountRef,
        credential: valuesOf(found, connector.auth),
      }
    },
    async columns(at) {
      const found = await opened(at)
      if (found === null) return { kind: 'UNAVAILABLE' }
      const { connector } = found
      const tables = connector.tables
      if (tables === undefined) return { kind: 'READ', columns: new Map() }
      const calls = readsFor(tables)
      const done = await deps.limits.inTurn(found.id, deps.callDeadlineMs, () =>
        discoverTables({
          connector,
          session: deps.limits.session(found),
          send: deps.executor.tableSend(found),
          account: { ref: found.accountRef },
          signal: AbortSignal.timeout(deps.callDeadlineMs * calls),
        }),
      )
      if ('kind' in done) return { kind: 'UNAVAILABLE' }
      const columns = new Map<string, readonly CopyColumn[]>()
      for (const { declaration, columns: answered } of done)
        if (answered !== null) columns.set(sourceOf(declaration), answered)
      return { kind: 'READ', columns }
    },
  }
}
