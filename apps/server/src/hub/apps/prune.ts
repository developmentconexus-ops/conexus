import type { AppVersionId, CompanyId, ProjectId } from '@conexus/hub-api'
import { appWorkerOf, AppVersionId as VersionId } from '@conexus/hub-api'
import { and, desc, eq, inArray, ne, notInArray } from 'drizzle-orm'
import type { CloudflareApps } from '../../platform/cloudflare.ts'
import type { CommandTx, Database, Scope } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { app, appVersion, blob, versionFile } from './tables.ts'

/** The versions kept besides the one on the air, so Voltar has somewhere to go (founder, 6C). */
const KEPT_OLD_VERSIONS = 3

type Ids = { companyId: CompanyId; projectId: ProjectId }

/**
 * Marks for the prune, in the transaction that put `liveVersionId` on the air: every failed version,
 * and the ready ones past the newest three other than the live one. A version being sent stays.
 */
export async function markPrune(tx: CommandTx, input: Ids & { liveVersionId: string }) {
  const kept = await tx
    .select({ id: appVersion.id })
    .from(appVersion)
    .where(
      and(
        eq(appVersion.projectId, input.projectId),
        eq(appVersion.state, 'ready'),
        ne(appVersion.id, input.liveVersionId),
      ),
    )
    .orderBy(desc(appVersion.number))
    .limit(KEPT_OLD_VERSIONS)
  await tx
    .update(appVersion)
    .set({ state: 'pruning' })
    .where(
      and(
        eq(appVersion.projectId, input.projectId),
        inArray(appVersion.state, ['ready', 'failed']),
        notInArray(appVersion.id, [input.liveVersionId, ...kept.map(({ id }) => id)]),
      ),
    )
}

/**
 * Removes the company's bytes no version names any more, one at a time: a blob another send has
 * just named, in this company, refuses with 23503 and stays (decision 0012).
 */
export async function deleteUnusedBlobs(tx: CommandTx, companyId: CompanyId, shas: string[]) {
  for (const sha256 of new Set(shas)) {
    try {
      await tx.transaction((savepoint) =>
        savepoint.delete(blob).where(and(eq(blob.companyId, companyId), eq(blob.sha256, sha256))),
      )
    } catch (error) {
      if (!isForeignKeyViolation(error)) throw error
    }
  }
}

function isForeignKeyViolation(error: unknown): boolean {
  for (let cause = error; cause instanceof Error; cause = cause.cause) {
    if ('code' in cause && cause.code === '23503') return true
  }
  return false
}

/** Deletes the versions' rows, their files with them, then the bytes nothing names any more. */
async function deleteVersionRows(tx: CommandTx, companyId: CompanyId, ids: string[]) {
  if (ids.length === 0) return
  const files = await tx
    .select({ sha256: versionFile.sha256 })
    .from(versionFile)
    .where(inArray(versionFile.versionId, ids))
  await tx.delete(appVersion).where(inArray(appVersion.id, ids))
  await deleteUnusedBlobs(
    tx,
    companyId,
    files.map(({ sha256 }) => sha256),
  )
}

/**
 * Removes each version's Worker; the ones Cloudflare did not confirm, or that the budget did not
 * reach, stay for the next pass.
 */
export async function removeWorkers(
  cloudflare: CloudflareApps,
  versionIds: readonly AppVersionId[],
  budget?: AbortSignal,
): Promise<{ removed: AppVersionId[]; left: number }> {
  const removed: AppVersionId[] = []
  for (const id of versionIds) {
    if (budget?.aborted) break
    if ((await cloudflare.remove(appWorkerOf(id), budget)).kind === 'DONE') removed.push(id)
  }
  return { removed, left: versionIds.length - removed.length }
}

export type PruneDeps = { database: Database; cloudflare: CloudflareApps; log: FailureLog }

/**
 * How long a send's answer waits for its prune's Cloudflare calls, inside the screen's deadline
 * (code C57); what it leaves is pruned by the next send.
 */
export const PRUNE_BUDGET_MS = 10_000

/**
 * The prune the send marked, with no transaction open for Cloudflare (data D22): each version's
 * Worker first, then its rows; a version whose Worker stays keeps its mark for the next prune.
 */
export async function prune(deps: PruneDeps, input: Ids & { scope: Scope }): Promise<void> {
  const marked = await deps.database.read(input.scope, (tx) =>
    tx
      .select({ id: appVersion.id })
      .from(appVersion)
      .where(and(eq(appVersion.projectId, input.projectId), eq(appVersion.state, 'pruning'))),
  )
  if (marked.length === 0) return
  const { removed, left } = await removeWorkers(
    deps.cloudflare,
    marked.map(({ id }) => VersionId.parse(id)),
    AbortSignal.timeout(PRUNE_BUDGET_MS),
  )
  await deps.database.command(input.scope, async (tx) => {
    // The app's row first, as every write to its versions takes it (code C65).
    await tx.select().from(app).where(eq(app.projectId, input.projectId)).for('update')
    await deleteVersionRows(tx, input.companyId, removed)
  })
  const { companyId, projectId } = input
  deps.log.info({ companyId, projectId, pruned: removed.length, left }, 'APP_VERSION_PRUNED')
}
