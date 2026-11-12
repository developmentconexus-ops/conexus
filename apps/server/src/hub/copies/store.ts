import type {
  CompanyId,
  ConnectionId,
  CopyId,
  CopyInterval,
  CopyOrigin,
  CopyProposalId,
  CopyProposalSummary,
  CopyRunFailureCode,
  CopySchedule,
  CopyShown,
  CopySource,
  PersonId,
  ProjectId,
} from '@conexus/hub-api'
import {
  CompanyId as CompanyIdSchema,
  ConnectionId as ConnectionIdSchema,
  CopyId as CopyIdSchema,
  CopyProposalId as CopyProposalIdSchema,
  PersonId as PersonIdSchema,
  ProjectId as ProjectIdSchema,
} from '@conexus/hub-api'
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm'
import type { CompanyPostgres } from '../../platform/company-postgres.ts'
import type { CopyTable } from '../../platform/copy-sql.ts'
import type { Database, DatabaseUrl, ReadTx, Scope } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { NeonProjects } from '../../platform/neon.ts'
import type { Connectors } from '../connectors/public.ts'
import {
  CopyDefinition,
  CopyName,
  connectionNamesOf,
  operationLabel,
} from '../connectors/public.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { personNameColumn } from '../identity/public.ts'
import type { ProjectPorts } from '../projects/public.ts'
import { copyModeOf } from './mode.ts'
import { copy, copyProposal, copyProposalSource } from './tables.ts'

/** What the clock holds for a copy: its schedule, and the interval it was set with. */
export type CopyState = Readonly<{ schedule: CopySchedule; interval: CopyInterval }>

/** What the clock does for a copy: the Builder implements it, and the Hub never imports the Builder. */
export type CopyClock = {
  /** CREATED for the one call that made the schedule, even among concurrent ones; UPDATED otherwise. */
  set(input: {
    companyId: CompanyId
    copyId: CopyId
    interval: CopyInterval
  }): Promise<'CREATED' | 'UPDATED'>
  pause(copyId: CopyId): Promise<void>
  /** A MISSING copy is not resumed here: the service calls `set`. */
  resume(copyId: CopyId): Promise<void>
  runNow(copyId: CopyId): Promise<void>
  remove(copyId: CopyId): Promise<void>
  /** The company's copies that have a schedule; one with none is not in the map (MISSING). */
  states(companyId: CompanyId): Promise<ReadonlyMap<CopyId, CopyState>>
}

/** The Projeto's schema and logins in the company's database, made by `hub/apps` when it has no app yet. */
type ProjectDatabase = {
  projectDatabase(input: {
    companyId: CompanyId
    personId: PersonId
    projectId: ProjectId
  }): Promise<{ kind: 'OPEN' } | { kind: 'FAILED' }>
}

export type CopyOutcome =
  | { kind: 'COMPLETE' }
  /** WAIT: the provider answered 429, or the connector's lane passed its deadline; each source keeps its position. */
  | { kind: 'PARTIAL'; reason: 'CAP' | 'STOPPED' | 'WAIT' }
  | { kind: 'ERROR'; code: CopyRunFailureCode }
  | { kind: 'INTERRUPTED' }

export type CopyRunEnd =
  /** Another run holds the lease: nothing read, no run row. */
  | { kind: 'RUNNING' }
  /** No such copy: the clock removes its schedule. */
  | { kind: 'GONE' }
  | { kind: 'ENDED'; outcome: CopyOutcome }

/** What tests shorten (T20); production's are `RUN_DEFAULTS`. */
export type CopyTuning = { pageRows?: number; runPages?: number; runMs?: number; leaseMs?: number }

export type CopiesDeps = {
  database: Database
  identity: IdentityPorts
  projects: ProjectPorts
  neon: NeonProjects
  companyPostgres: CompanyPostgres
  connectors: () => Connectors['copies']
  /** One page of a proposed copy as the Builder's turn may read the connection, counted in its run (Capacidade 3). */
  prove: () => Connectors['builder']['provePage']
  apps: () => ProjectDatabase
  clock: () => CopyClock
  log: FailureLog
  updating: () => boolean
  tuning: Required<CopyTuning>
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
  }
}
export type StoredCopy = ReturnType<typeof parsedCopy>

/** The copy's table as the company's database keeps it: with the account's columns when its sources have an account, and a version 2's instants with their offset. */
export function copyTableOf(
  stored: Pick<StoredCopy, 'name' | 'definition'>,
  sources: readonly { accountRef: string | null }[],
): CopyTable {
  return {
    name: stored.name,
    definition: stored.definition,
    accounts: sources.some((source) => source.accountRef !== null),
    instants: stored.definition.version === 2 ? 'OFFSET' : 'LOCAL',
  }
}

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
export function originOf(connector: string, definition: CopyDefinition): CopyOrigin {
  if (definition.version === 1) return { kind: 'QUERY', query: definition.source.sql }
  const { operation, input } = definition.source
  return { kind: 'OPERATION', operation, label: operationLabel(connector, operation), input }
}

/** What the list shows of a definition: where it reads, its key, the two date filters, and the descriptions. */
export function shownOf(connector: string, definition: CopyDefinition): CopyShown {
  const window = definition.version === 1 ? definition.window : undefined
  return {
    source: originOf(connector, definition),
    key: definition.key,
    changedSince: definition.changedSince,
    window: window === undefined ? null : { column: window.column, days: window.days },
    description: definition.version === 2 ? definition.description : null,
    columns:
      definition.version === 1
        ? definition.columns.map(({ name, type }) => ({ name, type, description: null }))
        : definition.columns.map(({ name, type, description }) => ({
            ...{ name, type },
            description: description ?? null,
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

/** Each proposal's connections, its own first. */
async function proposalSources(tx: ReadTx, companyId: CompanyId, ids: readonly string[]) {
  if (ids.length === 0) return new Map<string, CopySource[]>()
  const rows = await tx
    .select({
      of: copyProposalSource.proposalId,
      connectionId: copyProposalSource.connectionId,
    })
    .from(copyProposalSource)
    .innerJoin(copyProposal, eq(copyProposal.id, copyProposalSource.proposalId))
    .where(
      and(
        eq(copyProposalSource.companyId, companyId),
        inArray(copyProposalSource.proposalId, [...ids]),
      ),
    )
    .orderBy(
      desc(sql`${copyProposalSource.connectionId} = ${copyProposal.connectionId}`),
      asc(copyProposalSource.connectionId),
    )
  const parsed = rows.map((row) => ({
    ...row,
    connectionId: ConnectionIdSchema.parse(row.connectionId),
  }))
  return sourcesNamed(tx, companyId, parsed)
}

/**
 * The company's open proposals, and those `named` by id whatever their state (the conversation's
 * cards), as the list states them; one of a Projeto deleted or marked is left out.
 */
export async function proposalsOf(
  deps: Pick<CopiesDeps, 'projects'>,
  tx: ReadTx,
  input: { companyId: CompanyId; named: readonly CopyProposalId[] },
): Promise<CopyProposalSummary[]> {
  const { companyId } = input
  const rows = await tx
    .select({ row: copyProposal, proposedByName: personNameColumn(copyProposal.proposedBy) })
    .from(copyProposal)
    .where(
      and(
        eq(copyProposal.companyId, companyId),
        or(
          eq(copyProposal.state, 'OPEN'),
          input.named.length === 0 ? undefined : inArray(copyProposal.id, [...input.named]),
        ),
      ),
    )
    .orderBy(copyProposal.name)
  const projects = await deps.projects.liveProjectNamesOf(tx, {
    companyId,
    ids: rows.map(({ row }) => ProjectIdSchema.parse(row.projectId)),
  })
  const sources = await proposalSources(
    tx,
    companyId,
    rows.map(({ row }) => row.id),
  )
  return rows.flatMap(({ row, proposedByName }) => {
    const projectId = ProjectIdSchema.parse(row.projectId)
    const project = projects.get(projectId)
    if (project === undefined) return []
    const definition = CopyDefinition.parse(row.definition)
    return [
      {
        id: CopyProposalIdSchema.parse(row.id),
        name: row.name,
        label: row.label,
        sources: sources.get(row.id) ?? [],
        project: { id: projectId, name: project },
        shown: shownOf(row.connectorId, definition),
        mode: copyModeOf(definition),
        proved: { rows: row.provedRows, more: row.provedMore, calls: row.provedCalls },
        proposedBy: { id: PersonIdSchema.parse(row.proposedBy), name: proposedByName ?? '' },
        state: row.state,
      },
    ]
  })
}
