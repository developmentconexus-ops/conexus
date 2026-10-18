import { APP_COMPATIBILITY_DATE } from '@conexus/app-contract'
import type {
  AppVersion,
  AppVersionId,
  CompanyId,
  Person,
  ProjectId,
  VersionFileInput,
} from '@conexus/hub-api'
import { appWorkerOf } from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import type { CloudflareApps } from '../../platform/cloudflare.ts'
import type { CommandTx, ReadTx, Scope } from '../../platform/database.ts'
import { databaseFailure } from '../../platform/database.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { IdentityPorts } from '../identity/public.ts'
import type { AppDatabaseDeps } from './app-database.ts'
import { migrateApp, openAppDatabase } from './app-database.ts'
import { app, appVersion } from './tables.ts'
import type { ReceivedVersion, VersionFailure } from './versions.ts'
import { failVersion, holdsClaim, lockApp, receiveVersion, storeAppVersion } from './versions.ts'

export type SendDeps = AppDatabaseDeps & { identity: IdentityPorts; cloudflare: CloudflareApps }

/** The CPU each call of an app may use until step 10 sets the limits of execution. */
const APP_CPU_MS = 50

type Ids = { companyId: CompanyId; projectId: ProjectId }
type Sending = Ids & { scope: Scope; versionId: AppVersionId; received: ReceivedVersion }

type Admitting = Pick<SendDeps, 'identity' | 'projects'>

async function admitTo(
  deps: Admitting,
  tx: ReadTx,
  input: Ids & { person: Person; action: 'manageAppVersions' | 'readAppVersions' },
) {
  const { person, companyId, action } = input
  await deps.identity.admitMember({ tx, personId: person.id, companyId, action })
  const found = await deps.projects.liveProjectOf(tx, input)
  if (found === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'NO_PROJECT' } })
}

/** Admits an owner or administrator to send or put back a version, holding their membership (S8). */
export function admitManager(deps: Admitting, tx: CommandTx, input: Ids & { person: Person }) {
  return admitTo(deps, tx, { ...input, action: 'manageAppVersions' })
}

/** Admits an owner or administrator to read the versions of a Projeto not marked for deletion. */
export function admitReader(deps: Admitting, tx: ReadTx, input: Ids & { person: Person }) {
  return admitTo(deps, tx, { ...input, action: 'readAppVersions' })
}

/** Whether the send may go on: its claim is still its own and the Projeto is not being deleted. */
function mayGoOn(deps: SendDeps, sending: Sending): Promise<boolean> {
  return deps.database.read(sending.scope, async (tx) => {
    const project = await deps.projects.liveProjectOf(tx, sending)
    return project !== undefined && (await holdsClaim(tx, sending))
  })
}

/**
 * Everything outside a transaction (data D22), in the order of decision 0046: the Worker first, so
 * code that does not start touches no database; then the app's schema and logins, and its pending
 * migrations in one transaction. The claim and the deletion mark are read before each.
 */
async function prepare(
  deps: SendDeps,
  sending: Sending & { databaseReady: boolean },
): Promise<VersionFailure | undefined> {
  const { companyId, projectId, received } = sending
  if (!(await mayGoOn(deps, sending))) return 'APP_VERSION_FAILED'
  const uploaded = await deps.cloudflare.upload({
    worker: appWorkerOf(sending.versionId),
    mainModule: received.manifest.entry,
    compatibilityDate: APP_COMPATIBILITY_DATE[received.manifest.contract],
    files: received.files,
    tags: [`company-${companyId}`, `project-${projectId}`],
    cpuMs: APP_CPU_MS,
  })
  if (uploaded.kind !== 'DONE') return 'APP_VERSION_FAILED'
  if (uploaded.value === 'NOT_STARTING') return 'APP_VERSION_NOT_STARTING'
  deps.log.info({ companyId, projectId, versionId: sending.versionId }, 'APP_VERSION_UPLOADED')
  const opened = await openAppDatabase(deps, sending)
  if (opened.kind === 'FAILED') return opened.failure
  if (!(await mayGoOn(deps, sending))) return 'APP_VERSION_FAILED'
  return migrateApp(deps, { ...sending, owner: opened.owner, manifest: received.manifest })
}

/** A send that cannot finish leaves its version failed; the next send fails it if this cannot. */
async function fail(deps: SendDeps, sending: Sending, failure: VersionFailure): Promise<void> {
  await deps.database
    .command(sending.scope, (tx) =>
      failVersion(tx, { projectId: sending.projectId, versionId: sending.versionId, failure }),
    )
    .catch((error: unknown) => logFailure(deps.log, databaseFailure(error)))
}

/** The Worker of a version that will never be on the air; one Cloudflare keeps goes with the prune. */
async function removeWorker(deps: SendDeps, versionId: AppVersionId): Promise<void> {
  await deps.cloudflare.remove(appWorkerOf(versionId))
}

/**
 * Puts the version on the air if the send still holds the claim and the Projeto is not marked for
 * deletion, under the admission read again (security S8).
 */
function finish(deps: SendDeps, sending: Sending & { person: Person }) {
  return deps.database.command(sending.scope, async (tx) => {
    await admitManager(deps, tx, sending)
    const held = await lockApp(tx, sending)
    if (held.sendingVersionId !== sending.versionId) return { kind: 'LOST' } as const
    await tx.update(appVersion).set({ state: 'ready' }).where(eq(appVersion.id, sending.versionId))
    await tx
      .update(app)
      .set({
        liveVersionId: sending.versionId,
        sendingVersionId: null,
        claimedUntil: null,
        databaseReady: true,
      })
      .where(eq(app.projectId, sending.projectId))
    return { kind: 'LIVE' } as const
  })
}

export type Sent = { version: AppVersion; created: boolean }

/**
 * Sends a version of a Projeto's app: a first transaction stores it and takes the claim, the
 * Worker and the database are prepared with none open, and a second puts it on the air (data D22).
 * A death in the middle leaves the pointer as it was (code C65).
 */
export async function sendVersion(
  deps: SendDeps,
  input: Ids & {
    person: Person
    manifest: unknown
    files: readonly VersionFileInput[]
    attemptKey: string
  },
): Promise<Sent> {
  const received = receiveVersion(input)
  const { person, companyId, projectId } = input
  const scope: Scope = { kind: 'COMPANY', companyId, personId: person.id }
  const stored = await deps.database.command(scope, async (tx) => {
    await admitManager(deps, tx, input)
    return storeAppVersion({
      tx,
      ids: { companyId, projectId },
      sentBy: person.id,
      received,
      attemptKey: input.attemptKey,
    })
  })
  if (stored.kind === 'REPLAY') return { version: stored.version, created: false }
  const versionId = stored.version.id
  const sending: Sending = { scope, companyId, projectId, versionId, received }
  deps.log.info({ companyId, projectId, versionId }, 'APP_VERSION_RECEIVED')
  const failure = await prepare(deps, { ...sending, databaseReady: stored.databaseReady })
  if (failure !== undefined) {
    await fail(deps, sending, failure)
    throw new Failure(failure, { details: { companyId, projectId, versionId } })
  }
  let finished: Awaited<ReturnType<typeof finish>>
  try {
    finished = await finish(deps, { ...sending, person })
  } catch (error) {
    await fail(deps, sending, 'APP_VERSION_FAILED')
    if (error instanceof Failure && error.code === 'NOT_FOUND') await removeWorker(deps, versionId)
    throw error
  }
  if (finished.kind === 'LOST') {
    await removeWorker(deps, versionId)
    throw new Failure('APP_VERSION_FAILED', {
      details: { companyId, projectId, reason: 'CLAIM_LOST' },
    })
  }
  deps.log.info({ companyId, projectId, versionId }, 'APP_VERSION_LIVE')
  return { version: { ...stored.version, state: 'ready', live: true }, created: true }
}
