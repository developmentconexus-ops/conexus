import type { Manifest } from '@conexus/app-contract'
import type {
  AppVersionFailure,
  CompanyId,
  MigrationCause,
  PersonId,
  ProjectId,
} from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import type {
  AppRead,
  AppReadAnswer,
  CompanyPostgres,
  SqlAnswer,
  SqlStatement,
} from '../../platform/company-postgres.ts'
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
  /** The copies are made after the apps; the repair of a Projeto's logins gives its releases back. */
  copies: () => {
    applyGrants(input: { companyId: CompanyId; projectId: ProjectId }): Promise<SqlAnswer>
  }
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
    // Logins made again lose what was granted them: the Projeto's releases are given back (a repair; a failure is only logged).
    const regranted = await deps.copies().applyGrants({ companyId, projectId })
    if (regranted.kind !== 'DONE') {
      const code = regranted.kind === 'REFUSED' ? regranted.code : regranted.kind
      deps.log.error({ companyId, projectId, code }, 'COPY_GRANT_FAILED')
    }
  }
  return { kind: 'OPEN', owner: owner.value }
}

/**
 * The Projeto's schema and logins for a copy released to it (Capacidade 2, U2): the app's row made
 * as its first send makes it, and the schema and logins by `openAppDatabase` when it has none, so
 * the first send finds them and the Projeto's deletion drops them.
 */
export async function projectDatabase(
  deps: AppDatabaseDeps,
  input: { companyId: CompanyId; personId: PersonId; projectId: ProjectId },
): Promise<{ kind: 'OPEN' } | { kind: 'FAILED' }> {
  const { companyId, projectId } = input
  const scope = { kind: 'COMPANY', companyId, personId: input.personId } as const
  const ready = await deps.database.command(scope, async (tx) => {
    await tx.insert(app).values({ companyId, projectId }).onConflictDoNothing()
    const [row] = await tx
      .select({ ready: app.databaseReady })
      .from(app)
      .where(eq(app.projectId, projectId))
    return row?.ready === true
  })
  if (ready) return { kind: 'OPEN' }
  const opened = await openAppDatabase(deps, { scope, companyId, projectId, databaseReady: false })
  if (opened.kind === 'FAILED') return { kind: 'FAILED' }
  await deps.database.command(scope, (tx) =>
    tx.update(app).set({ databaseReady: true }).where(eq(app.projectId, projectId)),
  )
  return { kind: 'OPEN' }
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

/** What the read login answered: past `NO_LOGIN`, which the owner's login made good and asked again. */
type ReadAnswered = Exclude<AppReadAnswer, { kind: 'NO_LOGIN' }>

/**
 * The statements as the Projeto's app read login, in one read-only transaction: its address comes
 * from the host the Hub recorded, with no call to Neon. A Projeto made before the login existed asks
 * the owner's address once to make it, then reads again. The caller logs what it read of the
 * answer: this logs only the login's own making (code C50).
 */
export async function askApp(
  deps: AppDatabaseDeps,
  input: {
    scope: { companyId: CompanyId; personId: PersonId }
    projectId: ProjectId
    statements: readonly SqlStatement[]
    signal: AbortSignal
  },
): Promise<ReadAnswered> {
  const { projectId, signal, statements } = input
  const { companyId } = input.scope
  const found = await appDatabaseOf(deps, input)
  if (found === undefined) return { kind: 'FAILED', code: 'APP_DATA_NO_APP' }
  function silent(cause: string) {
    return { kind: 'FAILED', code: 'APP_DATA_UNAVAILABLE', cause } as const
  }
  const address = await deps.companyPostgres.readAddress(found.host, projectId)
  let answer = await deps.companyPostgres.readApp(address, statements, signal)
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
    answer = await deps.companyPostgres.readApp(address, statements, signal)
  }
  return answer.kind === 'NO_LOGIN' ? silent('NO_LOGIN') : answer
}

/**
 * One read of a Projeto's app data for its agents (step 24.3, U3), as the app's read login. The log
 * carries ids and the kind of answer, never the SQL nor a row (code C50).
 */
export async function readAppData(
  deps: AppDatabaseDeps,
  input: {
    scope: { companyId: CompanyId; personId: PersonId }
    projectId: ProjectId
    statement: SqlStatement
    signal: AbortSignal
  },
): Promise<AppRead> {
  const { projectId } = input
  const { companyId } = input.scope
  const answer = await askApp(deps, { ...input, statements: [input.statement] })
  switch (answer.kind) {
    case 'ROWS':
      deps.log.info({ companyId, projectId, answer: answer.kind }, 'APP_DATA_READ')
      return { kind: 'ROWS', columns: answer.columns, rows: answer.rows }
    case 'REFUSED':
      deps.log.info(
        { companyId, projectId, answer: answer.kind, sqlstate: answer.sqlstate },
        'APP_DATA_READ',
      )
      return answer
    case 'FAILED':
      if (answer.code !== 'APP_DATA_NO_APP') {
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
      }
      return { kind: 'FAILED', code: answer.code }
    default:
      return answer satisfies never
  }
}
