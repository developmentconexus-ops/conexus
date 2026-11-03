import type { Manifest } from '@conexus/app-contract'
import type {
  AppVersionFailure,
  CompanyId,
  MigrationCause,
  PersonId,
  ProjectId,
} from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import type { AppRead, CompanyPostgres } from '../../platform/company-postgres.ts'
import type { Database, DatabaseUrl, Scope } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { NeonProjects } from '../../platform/neon.ts'
import type { ProjectPorts } from '../projects/public.ts'
import { app } from './tables.ts'

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

/**
 * The version's pending migrations, all or none (decision 0046); a refusal keeps its code and the
 * names it carries, never a value (code C52).
 */
export async function migrateApp(
  deps: AppDatabaseDeps,
  input: { owner: DatabaseUrl; companyId: CompanyId; projectId: ProjectId; manifest: Manifest },
): Promise<{ failure: AppVersionFailure; cause?: MigrationCause } | undefined> {
  const { companyId, projectId } = input
  const ran = await deps.companyPostgres.migrate(input.owner, projectId, input.manifest.migrations)
  switch (ran.kind) {
    case 'DONE':
      if (ran.applied > 0)
        deps.log.info({ companyId, projectId, applied: ran.applied }, 'APP_MIGRATED')
      return undefined
    case 'CHANGED':
      deps.log.error({ companyId, projectId, migration: ran.id }, 'APP_MIGRATION_CHANGED')
      return { failure: 'APP_MIGRATION_CHANGED' }
    case 'REFUSED_BY_RULE':
      deps.log.error({ companyId, projectId, ...ran.rule }, 'APP_MIGRATION_REFUSED')
      return { failure: 'APP_MIGRATION_REFUSED', cause: { kind: 'rule', ...ran.rule } }
    case 'REFUSED':
      deps.log.error({ companyId, projectId, code: ran.code }, 'APP_MIGRATION_FAILED')
      return {
        failure: 'APP_MIGRATION_FAILED',
        cause: {
          kind: 'database',
          sqlstate: ran.code,
          table: ran.table,
          column: ran.column,
          constraint: ran.constraint,
        },
      }
    case 'NO_ANSWER':
    case 'TOO_LARGE':
      return { failure: 'APP_VERSION_FAILED' }
    default:
      return ran satisfies never
  }
}

/** The company's database and host once the Projeto has an app in it, or none. */
export async function appDatabaseOf(
  deps: Pick<AppDatabaseDeps, 'database' | 'projects'>,
  input: { scope: { companyId: CompanyId; personId: PersonId }; projectId: ProjectId },
) {
  const { companyId, personId } = input.scope
  return deps.database.read({ kind: 'COMPANY', companyId, personId }, async (tx) => {
    const [row] = await tx
      .select({ ready: app.databaseReady })
      .from(app)
      .where(eq(app.projectId, input.projectId))
    if (row?.ready !== true) return undefined
    const ready = await deps.projects.readyDatabaseOf(tx, companyId)
    return ready?.host == null
      ? undefined
      : { neonProjectId: ready.neonProjectId, host: ready.host }
  })
}

/**
 * One read of a Projeto's app data for its agents (step 24.3, U3), as the app's read login: its
 * address comes from the host the Hub recorded, with no call to Neon. A Projeto made before the
 * login existed asks the owner's address once to make it, then reads again. The log carries ids and
 * the kind of answer, never the SQL nor a row (code C50).
 */
export async function readAppData(
  deps: AppDatabaseDeps,
  input: {
    scope: { companyId: CompanyId; personId: PersonId }
    projectId: ProjectId
    sql: string
    signal: AbortSignal
  },
): Promise<AppRead> {
  const { projectId, signal } = input
  const { companyId } = input.scope
  const found = await appDatabaseOf(deps, input)
  if (found === undefined) return { kind: 'FAILED', code: 'APP_DATA_NO_APP' }
  const unavailable = { kind: 'FAILED', code: 'APP_DATA_UNAVAILABLE' } as const
  function silent(cause: string): typeof unavailable {
    deps.log.info(
      { companyId, projectId, answer: unavailable.kind, code: unavailable.code, cause },
      'APP_DATA_READ',
    )
    return unavailable
  }
  const address = await deps.companyPostgres.readAddress(found.host, projectId)
  let answer = await deps.companyPostgres.readApp(address, input.sql, signal)
  if (answer.kind === 'NO_LOGIN') {
    const owner = await deps.neon.ownerConnection(found.neonProjectId)
    if (owner.kind !== 'DONE') return silent(`OWNER_${owner.kind}`)
    const made = await deps.companyPostgres.ensureReadLogin(owner.value, projectId)
    if (made.kind !== 'DONE') {
      const code = made.kind === 'REFUSED' ? made.code : made.kind
      deps.log.error({ companyId, projectId, code }, 'APP_READ_LOGIN_FAILED')
      return silent('READ_LOGIN_NOT_MADE')
    }
    deps.log.info({ companyId, projectId }, 'APP_READ_LOGIN_CREATED')
    answer = await deps.companyPostgres.readApp(address, input.sql, signal)
  }
  switch (answer.kind) {
    case 'ROWS':
      deps.log.info({ companyId, projectId, answer: answer.kind }, 'APP_DATA_READ')
      return answer
    case 'REFUSED':
      deps.log.info(
        { companyId, projectId, answer: answer.kind, sqlstate: answer.sqlstate },
        'APP_DATA_READ',
      )
      return answer
    case 'FAILED':
      deps.log.info(
        {
          companyId,
          projectId,
          answer: answer.kind,
          code: answer.code,
          cause: answer.cause ?? 'none',
        },
        'APP_DATA_READ',
      )
      return { kind: 'FAILED', code: answer.code }
    case 'NO_LOGIN':
      return silent('NO_LOGIN')
    default:
      return answer satisfies never
  }
}
