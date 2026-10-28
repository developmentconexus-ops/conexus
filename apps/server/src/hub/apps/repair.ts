import { Manifest } from '@conexus/app-contract'
import type { CompanyId } from '@conexus/hub-api'
import {
  AppVersionId,
  appWorkerOf,
  CompanyId as CompanyIdSchema,
  ProjectId,
} from '@conexus/hub-api'
import { and, eq, isNotNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Scope } from '../../platform/database.ts'
import { databaseFailure } from '../../platform/database.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { AppDatabaseDeps } from './app-database.ts'
import { migrateApp, openAppDatabase } from './app-database.ts'
import { prune } from './prune.ts'
import type { RemovalDeps } from './removal.ts'
import { removeProjectApp, takeBackRepair } from './removal.ts'
import type { SendDeps } from './send.ts'
import { projectLive, uploadVersion } from './send.ts'
import { app, appVersion, blob, versionFile } from './tables.ts'
import { CLAIM_HELD, failVersion } from './versions.ts'

export type RepairDeps = SendDeps & RemovalDeps & AppDatabaseDeps

type Live = { projectId: ProjectId; versionId: AppVersionId; manifest: Manifest }

/** Sends past their claim fail: their holder died, and the next send would find them so. */
async function failExpiredSends(deps: RepairDeps, scope: Scope): Promise<number> {
  return deps.database.command(scope, async (tx) => {
    const expired = await tx
      .select({ projectId: app.projectId, versionId: app.sendingVersionId })
      .from(app)
      .where(and(isNotNull(app.sendingVersionId), sql`not ${CLAIM_HELD}`))
      .for('update')
    for (const { projectId, versionId } of expired) {
      if (versionId === null) continue
      await failVersion(tx, {
        projectId: ProjectId.parse(projectId),
        versionId,
        failure: 'APP_VERSION_FAILED',
      })
    }
    return expired.length
  })
}

/**
 * The Projetos whose deletion stopped after their mark: their apps go, then their conversations
 * and their rows. The ones still marked are never brought back.
 */
async function finishDeletions(deps: RepairDeps, scope: Scope, companyId: CompanyId) {
  const marked = await deps.database.read(scope, (tx) =>
    deps.projects.markedProjectsOf(tx, companyId),
  )
  const left = new Set<ProjectId>()
  for (const projectId of marked) {
    const ids = { companyId, projectId }
    if ((await removeProjectApp(deps, { scope, ...ids })) === 'LEFT') left.add(projectId)
    else {
      await deps.projects.finishMarkedProject({ scope, ...ids }).catch((error: unknown) => {
        logFailure(deps.log, databaseFailure(error))
        left.add(projectId)
      })
    }
  }
  return { deleted: marked.length - left.size, left }
}

/**
 * The versions still marked for the prune of each Projeto not being deleted: one a send's prune
 * left, or every hand-sent version the migration of step 14.1 marked (founder, 2026-10-25).
 */
async function pruneMarked(
  deps: RepairDeps,
  scope: Scope,
  input: { companyId: CompanyId; marked: Set<ProjectId> },
) {
  const rows = await deps.database.read(scope, (tx) =>
    tx
      .selectDistinct({ projectId: appVersion.projectId })
      .from(appVersion)
      .where(eq(appVersion.state, 'pruning')),
  )
  const projects = rows.map((row) => ProjectId.parse(row.projectId))
  for (const projectId of projects.filter((id) => !input.marked.has(id))) {
    await prune(deps, { scope, companyId: input.companyId, projectId })
  }
}

/** The version a pointer of each Projeto names, with the manifest it was sent with. */
function versionsPointedBy(
  deps: RepairDeps,
  scope: Scope,
  pointer: typeof app.liveVersionId | typeof app.publishedVersionId,
): Promise<Live[]> {
  return deps.database.read(scope, async (tx) => {
    const rows = await tx
      .select({ projectId: app.projectId, versionId: appVersion.id, manifest: appVersion.manifest })
      .from(app)
      .innerJoin(appVersion, eq(appVersion.id, pointer))
    return rows.map((row) => ({
      projectId: ProjectId.parse(row.projectId),
      versionId: AppVersionId.parse(row.versionId),
      manifest: Manifest.parse(row.manifest),
    }))
  })
}

/** Uploads a version's Worker again, from the files the Hub keeps (decision 0043). */
async function restoreWorker(
  deps: RepairDeps,
  scope: Scope,
  live: Live & { companyId: CompanyId },
) {
  const files = await deps.database.read(scope, (tx) =>
    tx
      .select({ path: versionFile.path, mediaType: versionFile.mediaType, bytes: blob.bytes })
      .from(versionFile)
      .innerJoin(
        blob,
        and(eq(blob.companyId, versionFile.companyId), eq(blob.sha256, versionFile.sha256)),
      )
      .where(eq(versionFile.versionId, live.versionId)),
  )
  const uploaded = await uploadVersion(deps.cloudflare, { ...live, files })
  if (uploaded.kind !== 'DONE' || uploaded.value !== 'UPLOADED') {
    throw new Failure('APP_VERSION_FAILED', { details: { reason: 'RESTORE_REFUSED' } })
  }
}

/** Uploads the version's Worker again if Cloudflare lost it; whether it had to. */
async function restoreWorkerIfLost(
  deps: RepairDeps,
  scope: Scope,
  live: Live & { companyId: CompanyId },
): Promise<boolean> {
  const found = await deps.cloudflare.exists(appWorkerOf(live.versionId))
  if (found.kind !== 'DONE')
    throw new Failure('APP_VERSION_FAILED', { details: { reason: 'NO_ANSWER' } })
  if (found.value) return false
  await restoreWorker(deps, scope, live)
  return true
}

function stillLive(
  deps: RepairDeps,
  ids: { scope: Scope; companyId: CompanyId; projectId: ProjectId },
) {
  return deps.database.read(ids.scope, (tx) => projectLive(deps, tx, ids))
}

/**
 * Brings each live app back to what the Hub holds: its Workers (the Prévia's and the published
 * one), if Cloudflare lost them, and its schema, logins and migrations, if a restore of the
 * company's database took them (founder, P2 A).
 */
async function restoreLive(
  deps: RepairDeps,
  scope: Scope,
  input: { companyId: CompanyId; marked: Set<ProjectId> },
) {
  const { companyId } = input
  let workers = 0
  const published = await versionsPointedBy(deps, scope, app.publishedVersionId)
  for (const live of await versionsPointedBy(deps, scope, app.liveVersionId)) {
    if (input.marked.has(live.projectId)) continue
    const ids = { scope, companyId, projectId: live.projectId }
    if (!(await stillLive(deps, ids))) continue
    if (await restoreWorkerIfLost(deps, scope, { ...live, companyId })) workers += 1
    // The published version's Worker only: its database and migrations are the Prévia's (step 17).
    const kept = published.find((one) => one.projectId === live.projectId)
    if (kept !== undefined && kept.versionId !== live.versionId) {
      if (await restoreWorkerIfLost(deps, scope, { ...kept, companyId })) workers += 1
    }
    const opened = await openAppDatabase(deps, { ...ids, databaseReady: false })
    if (opened.kind === 'FAILED') throw new Failure(opened.failure)
    const refused = await migrateApp(deps, { ...ids, owner: opened.owner, manifest: live.manifest })
    if (refused !== undefined) throw new Failure(refused.failure)
    // A deletion marked after the read above may have removed it all before this pass made it.
    if (!(await stillLive(deps, ids)))
      await takeBackRepair(deps, { ...ids, versionId: live.versionId })
  }
  return workers
}

const Listed = z.object({ company_id: CompanyIdSchema })

/**
 * One pass at start over every company with an app (architecture §8): sends past their claim fail,
 * stopped deletions finish, versions marked for the prune go, and live apps come back. A company
 * that fails is logged and left for the next start; the Hub starts all the same, Cloudflare or
 * Neon out.
 */
export async function repairApps(deps: RepairDeps): Promise<void> {
  const listed = await deps.database.installation((tx) =>
    tx.execute(sql`select company_id from apps.companies_with_apps()`),
  )
  for (const row of listed.rows) {
    const companyId = Listed.parse(row).company_id
    const scope: Scope = { kind: 'COMPANY', companyId, personId: null }
    try {
      const failed = await failExpiredSends(deps, scope)
      const { deleted, left } = await finishDeletions(deps, scope, companyId)
      const workers = await restoreLive(deps, scope, { companyId, marked: left })
      await pruneMarked(deps, scope, { companyId, marked: left })
      deps.log.info({ companyId, failed, deleted, workers }, 'APP_REPAIRED')
    } catch (error) {
      const failure = error instanceof Failure ? error : databaseFailure(error)
      deps.log.error({ companyId, code: failure.code }, 'APP_REPAIR_FAILED')
    }
  }
}
