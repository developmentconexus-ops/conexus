import type {
  CompanyId,
  CopyId,
  CopyInterval,
  CopyRunFailureCode,
  CopySchedule,
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
import { z } from 'zod'
import type { CompanyPostgres } from '../../platform/company-postgres.ts'
import type { Database, DatabaseUrl, ReadTx, Scope } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { NeonProjects } from '../../platform/neon.ts'
import type { Connectors } from '../connectors/public.ts'
import { CopyDefinition, CopyName } from '../connectors/public.ts'
import type { IdentityPorts } from '../identity/public.ts'
import type { ProjectPorts } from '../projects/public.ts'
import { copy } from './tables.ts'

/** What the clock does for a copy: the Builder implements it, and the Hub never imports the Builder. */
export type CopyClock = {
  set(input: { companyId: CompanyId; copyId: CopyId; interval: CopyInterval }): Promise<void>
  pause(copyId: CopyId): Promise<void>
  /** A MISSING copy is not resumed here: the service calls `set`. */
  resume(copyId: CopyId): Promise<void>
  runNow(copyId: CopyId): Promise<void>
  remove(copyId: CopyId): Promise<void>
  states(companyId: CompanyId): Promise<ReadonlyMap<CopyId, CopySchedule>>
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
  | { kind: 'PARTIAL'; reason: 'CAP' | 'STOPPED' }
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

/** A position: the last key written, one number per key column (code C27). */
const Position = z.array(z.int()).nullable()

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
    position: Position.parse(row.position),
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
