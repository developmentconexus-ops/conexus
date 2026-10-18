import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { AppVersionId } from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import type { CloudflareApps } from '../../platform/cloudflare.ts'
import type { CompanyPostgres } from '../../platform/company-postgres.ts'
import type { CommandTx, Database, Scope } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { NeonProjects } from '../../platform/neon.ts'
import { readyDatabaseOf } from '../projects/public.ts'
import { deleteUnusedBlobs, removeWorkers } from './prune.ts'
import { app, appVersion, blob, versionFile } from './tables.ts'
import { CLAIM_HELD, failVersion } from './versions.ts'

export type RemovalDeps = {
  database: Database
  cloudflare: CloudflareApps
  neon: NeonProjects
  companyPostgres: CompanyPostgres
  log: FailureLog
}

type Ids = { companyId: CompanyId; projectId: ProjectId }

/**
 * Takes the Projeto's app for its deletion, in the caller's transaction: a live send refuses, one
 * past its time fails, and that send, seeing the mark, removes its own Worker (code C65).
 */
export async function claimForDeletion(tx: CommandTx, ids: Ids): Promise<void> {
  const [row] = await tx
    .select({ sendingVersionId: app.sendingVersionId, held: CLAIM_HELD })
    .from(app)
    .where(eq(app.projectId, ids.projectId))
    .for('update')
  if (row?.sendingVersionId == null) return
  if (row.held) throw new Failure('APP_VERSION_SENDING')
  const failure = 'APP_VERSION_FAILED'
  await failVersion(tx, { projectId: ids.projectId, versionId: row.sendingVersionId, failure })
}

/** The app's schema and logins in the company's database; one never made drops nothing. */
async function dropAppDatabase(deps: RemovalDeps, input: Ids & { scope: Scope }) {
  const ready = await deps.database.read(input.scope, (tx) => readyDatabaseOf(tx, input.companyId))
  if (ready === undefined) return true
  const owner = await deps.neon.ownerConnection(ready.neonProjectId)
  if (owner.kind !== 'DONE') return false
  return (await deps.companyPostgres.dropApp(owner.value, input.projectId)).kind === 'DONE'
}

/**
 * Deletes a Projeto's app outside any transaction (data D22): every version's Worker, then its
 * schema and logins, and only then its rows and the bytes no other version names. What Cloudflare
 * or Neon did not confirm leaves the Projeto marked, for the repair at start to finish.
 */
export async function removeProjectApp(
  deps: RemovalDeps,
  input: Ids & { scope: Scope },
): Promise<'DONE' | 'LEFT'> {
  const { companyId, projectId, scope } = input
  const found = await deps.database.read(scope, async (tx) => {
    const [row] = await tx.select().from(app).where(eq(app.projectId, projectId))
    const ids = await tx
      .select({ id: appVersion.id })
      .from(appVersion)
      .where(eq(appVersion.projectId, projectId))
    return row === undefined ? undefined : ids
  })
  // A Projeto never sent a version has no app: nothing in Cloudflare or its database.
  if (found === undefined) return 'DONE'
  const versions = found
  const { left } = await removeWorkers(
    deps.cloudflare,
    versions.map(({ id }) => AppVersionId.parse(id)),
  )
  if (left > 0 || !(await dropAppDatabase(deps, input))) {
    deps.log.error({ companyId, projectId, workersLeft: left }, 'PROJECT_APP_DELETE_LEFT')
    return 'LEFT'
  }
  await deps.database.command(scope, async (tx) => {
    const files = await tx
      .select({ sha256: versionFile.sha256 })
      .from(versionFile)
      .innerJoin(appVersion, eq(appVersion.id, versionFile.versionId))
      .where(eq(appVersion.projectId, projectId))
    await tx.delete(app).where(eq(app.projectId, projectId))
    await deleteUnusedBlobs(
      tx,
      companyId,
      files.map(({ sha256 }) => sha256),
    )
  })
  deps.log.info({ companyId, projectId }, 'PROJECT_APP_DELETED')
  return 'DONE'
}

/**
 * Removes every Worker of a company the Central deletes, before its database in Neon goes with
 * the apps' schemas (code C8); any Worker left keeps the deletion pending.
 */
export async function removeCompanyWorkers(
  deps: RemovalDeps,
  input: { scope: Scope; companyId: CompanyId },
): Promise<void> {
  const versions = await deps.database.read(input.scope, (tx) =>
    tx
      .select({ id: appVersion.id })
      .from(appVersion)
      .where(eq(appVersion.companyId, input.companyId)),
  )
  const ids = versions.map(({ id }) => AppVersionId.parse(id))
  const { left } = await removeWorkers(deps.cloudflare, ids)
  if (left > 0) throw new Failure('CLIENT_DELETION_PENDING', { details: { workersLeft: left } })
}

/** The company's bytes, in the deletion's last transaction, once its Projects took their versions. */
export async function deleteCompanyBlobs(tx: CommandTx, companyId: CompanyId): Promise<void> {
  await tx.delete(blob).where(eq(blob.companyId, companyId))
}
