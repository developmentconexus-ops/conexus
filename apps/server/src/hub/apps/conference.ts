import type {
  AppVersionFailure,
  CompanyId,
  HostLabel,
  MigrationCause,
  PersonId,
  ProjectId,
} from '@conexus/hub-api'
import { AppSessionToken, appCheckLogin, appCheckWorkerOf, appHostOf } from '@conexus/hub-api'
import { eq, sql } from 'drizzle-orm'
import type { AppsDomain } from '../../platform/config.ts'
import type { Database, Scope } from '../../platform/database.ts'
import { databaseFailure } from '../../platform/database.ts'
import { logFailure } from '../../platform/failure.ts'
import type { Result } from '../../platform/result.ts'
import { migrateApp, openAppDatabase } from './app-database.ts'
import { hashOf, secret } from './handoff.ts'
import type { SendDeps } from './send.ts'
import { admitSender, projectLive, uploadVersion } from './send.ts'
import { checkSession } from './tables.ts'
import type { VersionFolder } from './versions.ts'
import { lockApp, receiveVersion } from './versions.ts'

const CHECK_SESSION_SECONDS = 10 * 60

export type Conference =
  | { kind: 'OPENED'; url: URL; session: AppSessionToken }
  | { kind: 'NOT_STARTING' }
  | { kind: 'MIGRATION_REFUSED'; failure: AppVersionFailure; cause?: MigrationCause }
  | { kind: 'NO_ADDRESS' }

type ConferenceDeps = SendDeps & { appsDomain: AppsDomain }
type Opening = {
  companyId: CompanyId
  projectId: ProjectId
  personId: PersonId
  folder: VersionFolder
}
type Opened = Result<Conference, 'CONFER_PLATFORM_FAILED'>

const PLATFORM_FAILED = { ok: false, error: 'CONFER_PLATFORM_FAILED' } as const

function ok(conference: Conference): Opened {
  return { ok: true, value: conference }
}

function admitted(deps: ConferenceDeps, scope: Scope, input: Opening) {
  return deps.database.command(scope, async (tx) => {
    const project = await admitSender(deps, tx, input)
    if (project.hostLabel === null) return { kind: 'NO_ADDRESS' } as const
    const { databaseReady } = await lockApp(tx, input)
    return { kind: 'HELD', hostLabel: project.hostLabel, databaseReady } as const
  })
}

async function sessionFor(
  deps: ConferenceDeps,
  input: Opening & { hostLabel: HostLabel },
): Promise<Conference> {
  const session = AppSessionToken.parse(secret())
  const { hostLabel, personId, companyId, projectId } = input
  await deps.database.installation((tx) =>
    tx.insert(checkSession).values({
      ...{ tokenHash: hashOf(session), hostLabel, personId, companyId, projectId },
      expiresAt: sql`statement_timestamp() + make_interval(secs => ${CHECK_SESSION_SECONDS})`,
    }),
  )
  const host = appHostOf({ label: hostLabel, appsDomain: deps.appsDomain })
  return { kind: 'OPENED', url: new URL(`https://${host}/`), session }
}

/**
 * Everything outside a transaction (data D22), in the order a send prepares: the conference
 * Worker first, so code that does not start touches no database, then the empty schema and the
 * version's migrations, then the session; the deletion mark is read again before each.
 */
async function conference(deps: ConferenceDeps, input: Opening): Promise<Opened> {
  const { companyId, projectId, personId } = input
  const scope: Scope = { kind: 'COMPANY', companyId, personId }
  function live() {
    return deps.database.read(scope, (tx) => projectLive(deps, tx, input))
  }
  async function stopped(): Promise<Opened> {
    deps.log.info({ companyId, projectId }, 'APP_CONFERENCE_STOPPED')
    // A deletion that ran whole during the upload found no Worker and no row: nothing else
    // knows this Worker, so it goes now, for no removal of the Projeto may come.
    const removed = await deps.cloudflare.remove(appCheckWorkerOf(projectId))
    if (removed.kind !== 'DONE') {
      deps.log.error({ companyId, projectId, code: removed.kind }, 'APP_CONFERENCE_WORKER_LEFT')
    }
    return PLATFORM_FAILED
  }
  const received = receiveVersion(input.folder)
  const held = await admitted(deps, scope, input)
  if (held.kind === 'NO_ADDRESS') return ok(held)
  const worker = appCheckWorkerOf(projectId)
  const uploaded = await uploadVersion(deps.cloudflare, { ...input, ...received, worker })
  if (uploaded.kind !== 'DONE') return PLATFORM_FAILED
  if (uploaded.value === 'NOT_STARTING') return ok({ kind: 'NOT_STARTING' })
  deps.log.info({ companyId, projectId }, 'APP_CONFERENCE_UPLOADED')
  if (!(await live())) return stopped()
  const opened = await openAppDatabase(deps, { ...input, scope, databaseReady: held.databaseReady })
  if (opened.kind === 'FAILED') return PLATFORM_FAILED
  if (!(await live())) return stopped()
  const reset = await deps.companyPostgres.resetCheck(opened.owner, projectId)
  if (reset.kind !== 'DONE') {
    const code = reset.kind === 'REFUSED' ? reset.code : reset.kind
    deps.log.error({ companyId, projectId, code }, 'APP_DATABASE_FAILED')
    return PLATFORM_FAILED
  }
  const logins = appCheckLogin(projectId)
  const manifest = received.manifest
  const refused = await migrateApp(deps, { ...input, owner: opened.owner, logins, manifest })
  if (refused?.failure === 'APP_VERSION_FAILED') return PLATFORM_FAILED
  if (refused !== undefined) return ok({ kind: 'MIGRATION_REFUSED', ...refused })
  deps.log.info({ companyId, projectId }, 'APP_CONFERENCE_DATABASE_READY')
  if (!(await live())) return stopped()
  return ok(await sessionFor(deps, { ...input, hostLabel: held.hostLabel }))
}

/**
 * Opens a Builder turn's version where its browser can see it: the Projeto's conference Worker over
 * an empty test schema, and a session of its own on the published app's host. What could not run
 * is a platform failure.
 */
export async function openConference(deps: ConferenceDeps, input: Opening): Promise<Opened> {
  try {
    return await conference(deps, input)
  } catch (error) {
    logFailure(deps.log, databaseFailure(error), {
      companyId: input.companyId,
      projectId: input.projectId,
    })
    return PLATFORM_FAILED
  }
}

export async function endConference(
  deps: { database: Database },
  input: { session: AppSessionToken },
): Promise<void> {
  await deps.database.installation((tx) =>
    tx.delete(checkSession).where(eq(checkSession.tokenHash, hashOf(input.session))),
  )
}
