import { createHash, randomBytes } from 'node:crypto'
import { Manifest } from '@conexus/app-contract'
import type { AppVersion, OfProject, PersonId, ProjectId, VersionFileInput } from '@conexus/hub-api'
import { AppVersionFailure, AppVersionId, ProjectId as ProjectIdSchema } from '@conexus/hub-api'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
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

/** A version folder as the Builder's machine handed it over, checked against its manifest there. */
export type VersionFolder = Readonly<{ manifest: Manifest; files: readonly VersionFileInput[] }>

/** A folder decoded and named by its content (code C37). */
export function receiveVersion(input: VersionFolder): ReceivedVersion {
  const files = input.files
    .map((file) => {
      const bytes = Buffer.from(file.base64, 'base64')
      return { path: file.path, mediaType: file.mediaType, sha256: sha256Of(bytes), bytes }
    })
    .sort((a, b) => (a.path < b.path ? -1 : 1))
  const digest = sha256Of(
    JSON.stringify({
      manifest: input.manifest,
      files: files.map(({ path, mediaType, sha256 }) => [path, mediaType, sha256]),
    }),
  )
  return { manifest: input.manifest, files, digest }
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

/** The app's two pointers: the version of the Prévia and the Builder, and the published one. */
// biome-ignore lint/plugin: the version rows hold strings and live.ts, removal.ts and repair.ts pass them on; the brand lands when those rows parse AppVersionId (C23)
type Pointers = { liveVersionId: string | null; publishedVersionId: string | null }

const ShownState = z.enum(['sending', 'ready', 'failed'])

/** A version as the list shows it; one being pruned is never shown. */
export function versionView(row: VersionRow, pointers: Pointers): AppVersion {
  return {
    id: AppVersionId.parse(row.id),
    number: row.number,
    state: ShownState.parse(row.state),
    failure: row.failure === null ? null : AppVersionFailure.parse(row.failure),
    sentBy: row.sentBy,
    sentByName: row.sentByName,
    createdAt: row.createdAt.toISOString(),
    live: row.id === pointers.liveVersionId,
    published: row.id === pointers.publishedVersionId,
  }
}

/** The Projeto's app row, made on its first send and held until the transaction ends (code C65). */
export async function lockApp(tx: CommandTx, ids: OfProject) {
  await tx.insert(app).values(ids).onConflictDoNothing()
  const [row] = await tx
    .select({
      liveVersionId: app.liveVersionId,
      publishedVersionId: app.publishedVersionId,
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

/** Ends a send that did not put its version in the Prévia: the version fails with its reason. */
export async function failVersion(
  tx: CommandTx,
  // biome-ignore lint/plugin: the version rows hold strings and live.ts, removal.ts and repair.ts pass them on; the brand lands when those rows parse AppVersionId (C23)
  input: { projectId: ProjectId; versionId: string; failure: AppVersionFailure },
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

export type Stored = { version: AppVersion; databaseReady: boolean }

/**
 * Stores a version as being sent, under the number the Builder saved it as, and takes the
 * Projeto's claim, in the caller's transaction. A live claim refuses; one past its time fails the
 * send that held it. A number or a run the Projeto already has is refused by its key, never
 * relabelled or replayed. Each file's bytes are kept once per company, and the upsert holds an
 * existing blob against a prune (decision 0012).
 */
export async function storeAppVersion(input: {
  tx: CommandTx
  ids: OfProject
  sentBy: PersonId
  received: ReceivedVersion
  attemptKey: string
  number: number
}): Promise<Stored> {
  const { tx, ids, received } = input
  const held = await lockApp(tx, ids)
  if (held.sendingVersionId !== null) {
    if (held.held) throw new Failure('APP_VERSION_SENDING')
    await failVersion(tx, {
      projectId: ids.projectId,
      versionId: held.sendingVersionId,
      failure: 'APP_VERSION_FAILED',
    })
  }
  const unique = new Map(received.files.map((file) => [file.sha256, file.bytes]))
  // In the prune's order, so a send and a prune that share blobs never wait on each other in a ring.
  for (const [sha256, bytes] of [...unique].sort(([a], [b]) => (a < b ? -1 : 1))) {
    await tx
      .insert(blob)
      .values({ companyId: ids.companyId, sha256, bytes })
      .onConflictDoUpdate({ target: [blob.companyId, blob.sha256], set: { sha256 } })
  }
  const [row] = await tx
    .insert(appVersion)
    .values({
      id: AppVersionId.parse(randomBytes(16).toString('hex')),
      ...ids,
      number: input.number,
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
    version: versionView(row, held),
    databaseReady: held.databaseReady,
  }
}

/** Whether the send still holds the Projeto's claim: no other send took it over. */
// biome-ignore lint/plugin: the version rows hold strings and live.ts, removal.ts and repair.ts pass them on; the brand lands when those rows parse AppVersionId (C23)
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
    .select({ liveVersionId: app.liveVersionId, publishedVersionId: app.publishedVersionId })
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
  const pointers = held ?? { liveVersionId: null, publishedVersionId: null }
  return rows.map((row) => versionView(row, pointers))
}

/** The numbers of the Prévia's and the published version, in one read; null before each first. */
export async function versionNumbersOf(
  tx: ReadTx,
  projectId: ProjectId,
): Promise<{ appVersion: number | null; publishedVersion: number | null }> {
  const preview = alias(appVersion, 'preview_version')
  const published = alias(appVersion, 'published_version')
  const [row] = await tx
    .select({ appVersion: preview.number, publishedVersion: published.number })
    .from(app)
    .leftJoin(preview, eq(preview.id, app.liveVersionId))
    .leftJoin(published, eq(published.id, app.publishedVersionId))
    .where(eq(app.projectId, projectId))
  return { appVersion: row?.appVersion ?? null, publishedVersion: row?.publishedVersion ?? null }
}

/** The published version of each of `projectIds` that has one, in one query (step 24.1's overview). */
export async function publishedVersionsOf(
  tx: ReadTx,
  projectIds: readonly ProjectId[],
): Promise<ReadonlyMap<ProjectId, number>> {
  if (projectIds.length === 0) return new Map()
  const rows = await tx
    .select({ projectId: app.projectId, number: appVersion.number })
    .from(app)
    .innerJoin(appVersion, eq(appVersion.id, app.publishedVersionId))
    .where(inArray(app.projectId, [...projectIds]))
  return new Map(rows.map((row) => [ProjectIdSchema.parse(row.projectId), row.number]))
}

/**
 * The roles the published version declares, with their labels, read from its manifest (step 18,
 * D): what "Quem usa o app" offers and the Hub accepts. None before the first Publicar, and none in
 * a manifest written before roles existed (0019).
 */
export async function publishedRolesOf(
  tx: ReadTx,
  projectId: ProjectId,
): Promise<{ published: boolean; roles: readonly { name: string; label: string }[] }> {
  const [row] = await tx
    .select({ manifest: appVersion.manifest })
    .from(app)
    .innerJoin(appVersion, eq(appVersion.id, app.publishedVersionId))
    .where(eq(app.projectId, projectId))
  if (row === undefined) return { published: false, roles: [] }
  return { published: true, roles: Manifest.parse(row.manifest).roles ?? [] }
}
