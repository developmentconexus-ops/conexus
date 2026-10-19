import type { Manifest } from '@conexus/app-contract'
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
import type { CloudflareApps, WorkerFile } from '../../platform/cloudflare.ts'
import type { CommandTx, ReadTx, Scope } from '../../platform/database.ts'
import { databaseFailure } from '../../platform/database.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { IdentityPorts } from '../identity/public.ts'
import type { AppDatabaseDeps } from './app-database.ts'
import { migrateApp, openAppDatabase } from './app-database.ts'
import { markPrune, prune } from './prune.ts'
import { app, appVersion } from './tables.ts'
import type { ReceivedVersion, VersionFailure } from './versions.ts'
import { failVersion, holdsClaim, lockApp, receiveVersion, storeAppVersion } from './versions.ts'

export type SendDeps = AppDatabaseDeps & { identity: IdentityPorts; cloudflare: CloudflareApps }

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

/** A version's Worker in the namespace, tagged with its company and Projeto (decision 0043). */
export function uploadVersion(
  cloudflare: CloudflareApps,
  input: Ids & { versionId: AppVersionId; manifest: Manifest; files: readonly WorkerFile[] },
) {
  return cloudflare.upload({
    worker: appWorkerOf(input.versionId),
    mainModule: input.manifest.entry,
    compatibilityDate: APP_COMPATIBILITY_DATE[input.manifest.contract],
    files: input.files,
    tags: [`company-${input.companyId}`, `project-${input.projectId}`],
  })
}

type Standing = 'GO' | 'LOST' | 'GONE'

/** Whether neither the Projeto nor its company is deleted or marked for deletion. */
export async function projectLive(deps: Admitting, tx: ReadTx, ids: Ids): Promise<boolean> {
  if (await deps.identity.markedDeleting(tx, ids.companyId)) return false
  return (await deps.projects.liveProjectOf(tx, ids)) !== undefined
}

/** Whether the send may go on: nothing is being deleted and the claim is still its own. */
function standing(deps: SendDeps, sending: Sending): Promise<Standing> {
  return deps.database.read(sending.scope, async (tx) => {
    if (!(await projectLive(deps, tx, sending))) return 'GONE'
    return (await holdsClaim(tx, sending)) ? 'GO' : 'LOST'
  })
}

type Prepared =
  | { kind: 'READY' }
  | { kind: 'FAILED'; failure: VersionFailure }
  | { kind: 'STOPPED'; why: Exclude<Standing, 'GO'> }

/**
 * Everything outside a transaction (data D22), in the order of decision 0046: the Worker first, so
 * code that does not start touches no database; then the app's schema and logins, and its pending
 * migrations in one transaction. The deletion mark and the claim are read before each.
 */
async function prepare(
  deps: SendDeps,
  sending: Sending & { databaseReady: boolean },
): Promise<Prepared> {
  const { companyId, projectId, received } = sending
  async function stopped() {
    const now = await standing(deps, sending)
    return now === 'GO' ? undefined : ({ kind: 'STOPPED', why: now } as const)
  }
  const before = await stopped()
  if (before !== undefined) return before
  const uploaded = await uploadVersion(deps.cloudflare, { ...sending, ...received })
  if (uploaded.kind !== 'DONE') return { kind: 'FAILED', failure: 'APP_VERSION_FAILED' }
  if (uploaded.value === 'NOT_STARTING') {
    return { kind: 'FAILED', failure: 'APP_VERSION_NOT_STARTING' }
  }
  deps.log.info({ companyId, projectId, versionId: sending.versionId }, 'APP_VERSION_UPLOADED')
  const uploadedThen = await stopped()
  if (uploadedThen !== undefined) return uploadedThen
  const opened = await openAppDatabase(deps, sending)
  if (opened.kind === 'FAILED') return opened
  const openedThen = await stopped()
  if (openedThen !== undefined) return openedThen
  const owner = opened.owner
  const failure = await migrateApp(deps, { ...sending, owner, manifest: received.manifest })
  return failure === undefined ? { kind: 'READY' } : { kind: 'FAILED', failure }
}

/** A send that cannot finish leaves its version failed; the next send fails it if this cannot. */
async function fail(deps: SendDeps, sending: Sending, failure: VersionFailure): Promise<void> {
  await deps.database
    .command(sending.scope, (tx) =>
      failVersion(tx, { projectId: sending.projectId, versionId: sending.versionId, failure }),
    )
    .catch((error: unknown) => logFailure(deps.log, databaseFailure(error)))
}

/**
 * A send that cannot go on: its version fails and frees the claim now, not when the claim ends
 * (code C65), and its Worker, if one was uploaded, goes now, for no prune of it may come.
 */
async function abandon(deps: SendDeps, sending: Sending): Promise<void> {
  await fail(deps, sending, 'APP_VERSION_FAILED')
  await deps.cloudflare.remove(appWorkerOf(sending.versionId))
}

/** Ends a send another act overtook: a deletion of its Projeto, or a send that took its claim. */
async function stop(deps: SendDeps, sending: Sending, why: 'LOST' | 'GONE'): Promise<never> {
  await abandon(deps, sending)
  const { companyId, projectId } = sending
  if (why === 'GONE') throw new Failure('NOT_FOUND', { details: { reason: 'DELETING' } })
  throw new Failure('APP_VERSION_FAILED', {
    details: { companyId, projectId, reason: 'CLAIM_LOST' },
  })
}

/**
 * Puts the version on the air if the send still holds the claim and the Projeto is not marked for
 * deletion, under the admission read again (security S8).
 */
function finish(deps: SendDeps, sending: Sending & { person: Person }) {
  return deps.database.command(sending.scope, async (tx) => {
    const { person, companyId } = sending
    await deps.identity.admitMember({
      tx,
      personId: person.id,
      companyId,
      action: 'manageAppVersions',
    })
    if ((await deps.projects.liveProjectOf(tx, sending)) === undefined)
      return { kind: 'GONE' } as const
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
    await markPrune(tx, { ...sending, liveVersionId: sending.versionId })
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
  // A throw on the way (the Hub's database, Neon refusing its key) abandons the send as well.
  const prepared = await prepare(deps, { ...sending, databaseReady: stored.databaseReady }).catch(
    async (error: unknown) => {
      await abandon(deps, sending)
      throw error
    },
  )
  if (prepared.kind === 'FAILED') {
    await fail(deps, sending, prepared.failure)
    throw new Failure(prepared.failure, { details: { companyId, projectId, versionId } })
  }
  if (prepared.kind === 'STOPPED') return stop(deps, sending, prepared.why)
  let finished: Awaited<ReturnType<typeof finish>>
  try {
    finished = await finish(deps, { ...sending, person })
  } catch (error) {
    await abandon(deps, sending)
    throw error
  }
  if (finished.kind !== 'LIVE') return stop(deps, sending, finished.kind)
  deps.log.info({ companyId, projectId, versionId }, 'APP_VERSION_LIVE')
  // The version is on the air: a prune that cannot finish now is retried by the next one.
  await prune(deps, sending).catch((error: unknown) => logFailure(deps.log, databaseFailure(error)))
  return { version: { ...stored.version, state: 'ready', live: true }, created: true }
}
