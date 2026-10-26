import type { Manifest } from '@conexus/app-contract'
import type { AppVersionFailure, CompanyId, ProjectId } from '@conexus/hub-api'
import type { CompanyPostgres } from '../../platform/company-postgres.ts'
import type { Database, DatabaseUrl, Scope } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { NeonProjects } from '../../platform/neon.ts'
import type { ProjectPorts } from '../projects/public.ts'

export type AppDatabaseDeps = {
  database: Database
  projects: ProjectPorts
  neon: NeonProjects
  companyPostgres: CompanyPostgres
  log: FailureLog
}

type Opened = { kind: 'OPEN'; owner: DatabaseUrl } | { kind: 'FAILED'; failure: AppVersionFailure }

/**
 * The company's database for a Projeto's app, with no transaction open (data D22): the owner's
 * address read from Neon for this act alone, the host the dispatcher reaches recorded once, and the
 * app's schema and logins made when the app has none yet (decision 0043).
 */
export async function openAppDatabase(
  deps: AppDatabaseDeps,
  input: { scope: Scope; companyId: CompanyId; projectId: ProjectId; databaseReady: boolean },
): Promise<Opened> {
  const { companyId, projectId } = input
  const failed = { kind: 'FAILED', failure: 'APP_VERSION_FAILED' } as const
  const ready = await deps.database.read(input.scope, (tx) =>
    deps.projects.readyDatabaseOf(tx, companyId),
  )
  if (ready === undefined) {
    deps.log.error({ companyId, projectId, reason: 'NO_COMPANY_DATABASE' }, 'APP_DATABASE_FAILED')
    return failed
  }
  const owner = await deps.neon.ownerConnection(ready.neonProjectId)
  if (owner.kind !== 'DONE') return failed
  const host = new URL(owner.value.reveal()).hostname
  if (ready.host !== host) {
    await deps.database.command(input.scope, (tx) =>
      deps.projects.recordDatabaseHost(tx, { companyId, host }),
    )
  }
  if (!input.databaseReady) {
    const made = await deps.companyPostgres.ensureApp(owner.value, projectId)
    if (made.kind !== 'DONE') {
      const code = made.kind === 'REFUSED' ? made.code : 'NO_ANSWER'
      deps.log.error({ companyId, projectId, code }, 'APP_DATABASE_FAILED')
      return failed
    }
    deps.log.info({ companyId, projectId }, 'APP_DATABASE_READY')
  }
  return { kind: 'OPEN', owner: owner.value }
}

/** The version's pending migrations, all or none (decision 0046); a refusal keeps only its code. */
export async function migrateApp(
  deps: AppDatabaseDeps,
  input: { owner: DatabaseUrl; companyId: CompanyId; projectId: ProjectId; manifest: Manifest },
): Promise<AppVersionFailure | undefined> {
  const { companyId, projectId } = input
  const ran = await deps.companyPostgres.migrate(input.owner, projectId, input.manifest.migrations)
  switch (ran.kind) {
    case 'DONE':
      if (ran.applied > 0)
        deps.log.info({ companyId, projectId, applied: ran.applied }, 'APP_MIGRATED')
      return undefined
    case 'CHANGED':
      deps.log.error({ companyId, projectId, migration: ran.id }, 'APP_MIGRATION_CHANGED')
      return 'APP_MIGRATION_CHANGED'
    case 'REFUSED':
      deps.log.error({ companyId, projectId, code: ran.code }, 'APP_MIGRATION_FAILED')
      return 'APP_MIGRATION_FAILED'
    case 'NO_ANSWER':
      return 'APP_VERSION_FAILED'
    default:
      return ran satisfies never
  }
}
