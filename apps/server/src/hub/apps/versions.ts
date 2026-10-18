import { createHash, randomBytes } from 'node:crypto'
import { APP_LIMITS, Manifest, versionFiles } from '@conexus/app-contract'
import type { AppVersion, CompanyId, PersonId, ProjectId, VersionFileInput } from '@conexus/hub-api'
import { AppVersionId } from '@conexus/hub-api'
import { and, desc, eq, inArray, max, sql } from 'drizzle-orm'
import { z } from 'zod'
import { CLOUDFLARE_DEADLINE_MS } from '../../platform/cloudflare.ts'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { NEON_CALL_BUDGET_MS, NEON_PREPARE_BUDGET_MS } from '../../platform/neon.ts'
import { personNameColumn } from '../identity/public.ts'
import { app, appVersion, blob, versionFile } from './tables.ts'

/** Past the calls a send makes with no transaction open, so its claim outlives them (0043). */
const CLAIM_MARGIN_MS = 5_000
const SEND_CLAIM_MS =
  NEON_PREPARE_BUDGET_MS + 2 * NEON_CALL_BUDGET_MS + CLOUDFLARE_DEADLINE_MS + CLAIM_MARGIN_MS
const CLAIM_UNTIL = sql`statement_timestamp() + ${SEND_CLAIM_MS} * interval '1 millisecond'`
/** Whether the Projeto's claim is still alive, read by the database's clock. */
export const CLAIM_HELD = sql<boolean>`${app.claimedUntil} > statement_timestamp()`

const MediaType = z.string().regex(/^[a-z]+\/[a-z0-9.+-]+(;\s?charset=[a-z0-9-]+)?$/)

/** One file of a version, decoded and named by its content. */
type VersionFile = Readonly<{
  path: string
  mediaType: string
  sha256: string
  bytes: Buffer
}>

/** A version as the send received it: its manifest, its files and their digest (code C37). */
export type ReceivedVersion = Readonly<{ manifest: Manifest; files: VersionFile[]; digest: string }>

function sha256Of(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex')
}

/** The bytes a base64 text holds, counted without decoding it. */
function decodedSize(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return (base64.length / 4) * 3 - padding
}

function invalid(reason: string): Failure {
  return new Failure('APP_VERSION_INVALID', { details: { reason } })
}

/**
 * Checks a folder against its manifest: the files it names, each once, and nothing else, within
 * the send's ceiling counted before any byte is decoded (code C26, C59).
 */
export function receiveVersion(input: {
  manifest: unknown
  files: readonly VersionFileInput[]
}): ReceivedVersion {
  const manifest = Manifest.safeParse(input.manifest)
  if (!manifest.success) throw invalid('MANIFEST')
  const expected = new Set(versionFiles(manifest.data))
  const sizes = input.files.map((file) => decodedSize(file.base64))
  const total = sizes.reduce((sum, size) => sum + size, 0)
  if (input.files.length > APP_LIMITS.files || total > APP_LIMITS.bytes) {
    throw new Failure('APP_VERSION_TOO_LARGE', { details: { files: input.files.length, total } })
  }
  const paths = new Set(input.files.map((file) => file.path))
  if (paths.size !== input.files.length) throw invalid('REPEATED')
  if (paths.size !== expected.size || ![...paths].every((path) => expected.has(path))) {
    throw invalid('FILES')
  }
  if (!input.files.every((file) => MediaType.safeParse(file.mediaType).success)) {
    throw invalid('MEDIA_TYPE')
  }
  const files = input.files
    .map((file) => {
      const bytes = Buffer.from(file.base64, 'base64')
      return { path: file.path, mediaType: file.mediaType, sha256: sha256Of(bytes), bytes }
    })
    .sort((a, b) => (a.path < b.path ? -1 : 1))
  const digest = sha256Of(
    JSON.stringify({
      manifest: manifest.data,
      files: files.map(({ path, mediaType, sha256 }) => [path, mediaType, sha256]),
    }),
  )
  return { manifest: manifest.data, files, digest }
}

/** The columns a version is shown from; the manifest and the files stay unread. */
export const VERSION_VIEW = {
  id: appVersion.id,
  number: appVersion.number,
  state: appVersion.state,
  failure: appVersion.failure,
  sentBy: appVersion.sentBy,
  sentByName: personNameColumn(appVersion.sentBy),
  createdAt: appVersion.createdAt,
}
type VersionRow = Pick<
  typeof appVersion.$inferSelect,
  Exclude<keyof typeof VERSION_VIEW, 'sentByName'>
> & { sentByName: string | null }
const FAILURE_CODES = [
  'APP_VERSION_FAILED',
  'APP_VERSION_NOT_STARTING',
  'APP_MIGRATION_FAILED',
  'APP_MIGRATION_CHANGED',
] as const
export type VersionFailure = (typeof FAILURE_CODES)[number]
const VersionFailure = z.enum(FAILURE_CODES)

const ShownState = z.enum(['sending', 'ready', 'failed'])

/** A version as the list shows it; one being pruned is never shown. */
export function versionView(row: VersionRow, liveVersionId: string | null): AppVersion {
  return {
    id: AppVersionId.parse(row.id),
    number: row.number,
    state: ShownState.parse(row.state),
    failure: row.failure === null ? null : VersionFailure.parse(row.failure),
    sentBy: row.sentBy,
    sentByName: row.sentByName,
    createdAt: row.createdAt.toISOString(),
    live: row.id === liveVersionId,
  }
}

type OfProject = { companyId: CompanyId; projectId: ProjectId }

/** The Projeto's app row, made on its first send and held until the transaction ends (code C65). */
export async function lockApp(tx: CommandTx, ids: OfProject) {
  await tx.insert(app).values(ids).onConflictDoNothing()
  const [row] = await tx
    .select({
      liveVersionId: app.liveVersionId,
      sendingVersionId: app.sendingVersionId,
      held: CLAIM_HELD,
      databaseReady: app.databaseReady,
    })
    .from(app)
    .where(eq(app.projectId, ids.projectId))
    .for('update')
  if (row === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'NO_APP' } })
  return row
}

/** Ends a send that did not put its version on the air: the version fails with its reason. */
export async function failVersion(
  tx: CommandTx,
  input: { projectId: ProjectId; versionId: string; failure: VersionFailure },
): Promise<void> {
  await tx
    .update(appVersion)
    .set({ state: 'failed', failure: input.failure })
    .where(and(eq(appVersion.id, input.versionId), eq(appVersion.state, 'sending')))
  await tx
    .update(app)
    .set({ sendingVersionId: null, claimedUntil: null })
    .where(and(eq(app.projectId, input.projectId), eq(app.sendingVersionId, input.versionId)))
}

/**
 * The version this attempt already sent: the same folder answers as it did, another folder under
 * the same key is another request (code C37). One pruned since is gone, so the key sends anew.
 */
async function replayOf(tx: CommandTx, input: OfProject & { attemptKey: string; digest: string }) {
  const [row] = await tx
    .select({ ...VERSION_VIEW, digest: appVersion.digest })
    .from(appVersion)
    .where(
      and(eq(appVersion.projectId, input.projectId), eq(appVersion.attemptKey, input.attemptKey)),
    )
  if (row === undefined) return undefined
  if (row.digest !== input.digest) throw new Failure('IDEMPOTENCY_CONFLICT')
  // A version being pruned still holds its key for the moment the prune takes.
  if (row.state === 'sending' || row.state === 'pruning') throw new Failure('APP_VERSION_SENDING')
  if (row.state === 'failed') throw new Failure(VersionFailure.parse(row.failure))
  return row
}

export type Stored =
  | { kind: 'REPLAY'; version: AppVersion }
  | { kind: 'NEW'; version: AppVersion; databaseReady: boolean }

/**
 * Stores a version as being sent and takes the Projeto's claim, in the caller's transaction, for
 * the screen now and the Builder in step 14. A live claim refuses; one past its time fails the send
 * that held it. Each file's bytes are kept once per company, and the upsert holds an existing blob
 * against a prune (decision 0012).
 */
export async function storeAppVersion(input: {
  tx: CommandTx
  ids: OfProject
  sentBy: PersonId
  received: ReceivedVersion
  attemptKey: string
}): Promise<Stored> {
  const { tx, ids, received } = input
  const held = await lockApp(tx, ids)
  const replay = await replayOf(tx, {
    ...ids,
    attemptKey: input.attemptKey,
    digest: received.digest,
  })
  if (replay !== undefined) {
    return { kind: 'REPLAY', version: versionView(replay, held.liveVersionId) }
  }
  if (held.sendingVersionId !== null) {
    if (held.held) throw new Failure('APP_VERSION_SENDING')
    await failVersion(tx, {
      projectId: ids.projectId,
      versionId: held.sendingVersionId,
      failure: 'APP_VERSION_FAILED',
    })
  }
  const unique = new Map(received.files.map((file) => [file.sha256, file.bytes]))
  for (const [sha256, bytes] of unique) {
    await tx
      .insert(blob)
      .values({ companyId: ids.companyId, sha256, bytes })
      .onConflictDoUpdate({ target: [blob.companyId, blob.sha256], set: { sha256 } })
  }
  const [last] = await tx
    .select({ number: max(appVersion.number) })
    .from(appVersion)
    .where(eq(appVersion.projectId, ids.projectId))
  const [row] = await tx
    .insert(appVersion)
    .values({
      id: AppVersionId.parse(randomBytes(16).toString('hex')),
      ...ids,
      number: (last?.number ?? 0) + 1,
      state: 'sending',
      manifest: received.manifest,
      digest: received.digest,
      sentBy: input.sentBy,
      attemptKey: input.attemptKey,
      createdAt: sql`statement_timestamp()`,
    })
    .returning({ ...VERSION_VIEW })
  if (row === undefined) throw new Failure('INTERNAL_UNEXPECTED')
  await tx.insert(versionFile).values(
    received.files.map((file) => ({
      versionId: row.id,
      companyId: ids.companyId,
      path: file.path,
      sha256: file.sha256,
      size: file.bytes.byteLength,
      mediaType: file.mediaType,
    })),
  )
  await tx
    .update(app)
    .set({ sendingVersionId: row.id, claimedUntil: CLAIM_UNTIL })
    .where(eq(app.projectId, ids.projectId))
  return {
    kind: 'NEW',
    version: versionView(row, held.liveVersionId),
    databaseReady: held.databaseReady,
  }
}

/** Whether the send still holds the Projeto's claim: no other send took it over. */
export async function holdsClaim(tx: ReadTx, input: { projectId: ProjectId; versionId: string }) {
  const [row] = await tx
    .select({ held: CLAIM_HELD })
    .from(app)
    .where(and(eq(app.projectId, input.projectId), eq(app.sendingVersionId, input.versionId)))
  return row?.held === true
}

/** The kept versions of a Projeto, newest first: the prune keeps them few (code C44). */
export async function listVersions(tx: ReadTx, ids: OfProject): Promise<AppVersion[]> {
  const [held] = await tx
    .select({ liveVersionId: app.liveVersionId })
    .from(app)
    .where(eq(app.projectId, ids.projectId))
  const rows = await tx
    .select(VERSION_VIEW)
    .from(appVersion)
    .where(
      and(
        eq(appVersion.projectId, ids.projectId),
        inArray(appVersion.state, ['sending', 'ready', 'failed']),
      ),
    )
    .orderBy(desc(appVersion.number))
  return rows.map((row) => versionView(row, held?.liveVersionId ?? null))
}
