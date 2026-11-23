import type {
  CompanyId,
  ConnectionId,
  CopyId,
  CopyOrigin,
  CopyShown,
  CopySource,
  PersonId,
  ProjectId,
} from '@conexus/hub-api'
import {
  CompanyId as CompanyIdSchema,
  ConnectionId as ConnectionIdSchema,
  CopyId as CopyIdSchema,
  PersonId as PersonIdSchema,
} from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { CompanyPostgres } from '../../platform/company-postgres.ts'
import type { Database, DatabaseUrl, ReadTx, Scope } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { NeonProjects } from '../../platform/neon.ts'
import {
  CopyDefinition,
  CopyName,
  connectionNamesOf,
  operationLabel,
} from '../connectors/public.ts'
import type { IdentityPorts } from '../identity/public.ts'
import type { ProjectPorts } from '../projects/public.ts'
import { ColumnState } from './column-state.ts'
import { copy } from './tables.ts'

/** The Projeto's schema and logins in the company's database, made by `hub/apps` when it has no app yet. */
type ProjectDatabase = {
  projectDatabase(input: {
    companyId: CompanyId
    personId: PersonId
    projectId: ProjectId
  }): Promise<{ kind: 'OPEN' } | { kind: 'FAILED' }>
}

export type CopiesDeps = {
  database: Database
  identity: IdentityPorts
  projects: ProjectPorts
  neon: NeonProjects
  companyPostgres: CompanyPostgres
  apps: () => ProjectDatabase
  log: FailureLog
}

export type InCompany = Readonly<{ companyId: CompanyId; personId: PersonId }>

/** The Hub's own work on a company's copies, with no person: a run, the release's repair. */
export function companyScope(companyId: CompanyId): Scope {
  return { kind: 'COMPANY', companyId, personId: null }
}

export function personScope(input: InCompany): Scope {
  return { kind: 'COMPANY', companyId: input.companyId, personId: input.personId }
}

/** A copy's row as the run and the release read it: the definition parsed again (code C27). */
export async function storedCopy(tx: ReadTx, ids: { companyId: CompanyId; copyId: CopyId }) {
  const [row] = await tx
    .select()
    .from(copy)
    .where(and(eq(copy.id, ids.copyId), eq(copy.companyId, ids.companyId)))
  return row === undefined ? undefined : parsedCopy(row)
}

export function parsedCopy(row: typeof copy.$inferSelect) {
  return {
    ...row,
    id: CopyIdSchema.parse(row.id),
    companyId: CompanyIdSchema.parse(row.companyId),
    connectionId: ConnectionIdSchema.parse(row.connectionId),
    createdBy: PersonIdSchema.parse(row.createdBy),
    name: CopyName.parse(row.name),
    definition: CopyDefinition.parse(row.definition),
    columnState: ColumnState.parse(row.columnState),
  }
}
export type StoredCopy = ReturnType<typeof parsedCopy>

/**
 * The company's database owner for this act alone, with no transaction open (data D22), the host
 * the Hub reaches it by recorded once, as `openAppDatabase` does.
 */
export async function companyOwner(
  deps: Pick<CopiesDeps, 'database' | 'projects' | 'neon' | 'log'>,
  input: InCompany,
): Promise<DatabaseUrl | undefined> {
  const scope = personScope(input)
  const { companyId } = input
  const ready = await deps.database.read(scope, (tx) =>
    deps.projects.readyDatabaseOf(tx, companyId),
  )
  if (ready === undefined) {
    deps.log.error({ companyId, reason: 'NO_COMPANY_DATABASE' }, 'COPY_DATABASE_FAILED')
    return undefined
  }
  const owner = await deps.neon.ownerConnection(ready.neonProjectId)
  if (owner.kind !== 'DONE') {
    deps.log.error({ companyId, reason: `OWNER_${owner.kind}` }, 'COPY_DATABASE_FAILED')
    return undefined
  }
  const host = new URL(owner.value.reveal()).hostname
  if (ready.host !== host) {
    await deps.database.command(scope, (tx) =>
      deps.projects.recordDatabaseHost(tx, { companyId, host }),
    )
  }
  return owner.value
}

/** Where the Hub reaches the sync login: the host it recorded, with no call to Neon; none before the company's database. */
export async function syncOf(
  deps: Pick<CopiesDeps, 'database' | 'projects' | 'companyPostgres'>,
  tx: ReadTx,
  companyId: CompanyId,
): Promise<DatabaseUrl | undefined> {
  const ready = await deps.projects.readyDatabaseOf(tx, companyId)
  return ready?.host == null ? undefined : deps.companyPostgres.syncAddress(ready.host)
}

/** What a copy reads, as the list and the model read it: version 1's query, or version 2's list read by its label, with its fixed input. */
function originOf(connector: string, definition: CopyDefinition): CopyOrigin {
  if (definition.version === 1) return { kind: 'QUERY', query: definition.source.sql }
  const { operation, input } = definition.source
  return { kind: 'OPERATION', operation, label: operationLabel(connector, operation), input }
}

/** What the list shows of a definition: where it reads, its key, the two date filters, and the descriptions. */
export function shownOf(
  connector: string,
  definition: CopyDefinition,
  state: ColumnState = {},
): CopyShown {
  const window = definition.version === 1 ? definition.window : undefined
  return {
    source: originOf(connector, definition),
    key: definition.key,
    changedSince: definition.changedSince,
    window: window === undefined ? null : { column: window.column, days: window.days },
    description: definition.description ?? null,
    columns: definition.columns.map(({ name, type, description }) => ({
      ...{ name, type },
      description: description ?? null,
      inactiveSince: state[name]?.inactiveSince ?? null,
    })),
  }
}

/** Each connection of the rows named, by the name the company gave it, in the order given; one gone is left out. */
export async function sourcesNamed(
  tx: ReadTx,
  companyId: CompanyId,
  rows: readonly { of: string; connectionId: ConnectionId }[],
): Promise<Map<string, CopySource[]>> {
  const names = await connectionNamesOf(tx, { companyId, ids: rows.map((row) => row.connectionId) })
  const sources = new Map<string, CopySource[]>()
  for (const row of rows) {
    const id = row.connectionId
    const named = names.get(id)
    if (named === undefined) continue
    const connection = { id, name: named.name, connector: named.connector }
    sources.set(row.of, [...(sources.get(row.of) ?? []), { connection }])
  }
  return sources
}
