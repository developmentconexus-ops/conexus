import { APP_CALL_LIMITS, APP_COMPATIBILITY_DATE } from '@conexus/app-contract'
import type { CompanyId } from '@conexus/hub-api'
import { ToolId, ToolVersionId, toolWorkerOf } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { WorkerUpload } from '../../platform/cloudflare.ts'
import { removeWorkers } from '../../platform/cloudflare.ts'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { ToolsDeps } from './access.ts'
import { tool, toolVersion } from './tables.ts'

/** The bundled tool's one file, as the Construtor's machine wrote it (`construtor/code-tool.ts`). */
const MODULE = 'module.js'

function hubScope(companyId: CompanyId) {
  return { kind: 'COMPANY', companyId, personId: null } as const
}

/**
 * A `CODE` version's Worker `t-<id>` (step 24.4): its module alone, no binding (the upload sends
 * none), the apps' CPU limit of decision 0047 and the contract's runtime date, tagged with its
 * company and tool.
 */
function uploadOf(
  ids: { companyId: CompanyId; toolId: ToolId; toolVersionId: ToolVersionId },
  module: string,
): WorkerUpload {
  return {
    worker: toolWorkerOf(ids.toolVersionId),
    mainModule: MODULE,
    compatibilityDate: APP_COMPATIBILITY_DATE[1],
    files: [
      {
        path: MODULE,
        bytes: new TextEncoder().encode(module),
        mediaType: 'application/javascript+module',
      },
    ],
    tags: [`company-${ids.companyId}`, `tool-${ids.toolId}`, 'kind-tool'],
    cpuMs: APP_CALL_LIMITS.cpuMs,
  }
}

/**
 * Uploads a version's Worker once its row committed (data D22). The Worker's presence is not
 * written: one that did not go up is uploaded by the first call that misses it.
 */
export async function uploadWorker(
  deps: Pick<ToolsDeps, 'cloudflare' | 'log'>,
  ids: { companyId: CompanyId; toolId: ToolId; toolVersionId: ToolVersionId },
  module: string,
): Promise<void> {
  const sent = await deps.cloudflare.upload(uploadOf(ids, module))
  const { companyId, toolVersionId } = ids
  if (sent.kind === 'DONE' && sent.value === 'UPLOADED') return
  const answer = sent.kind === 'DONE' ? sent.value : sent.kind
  deps.log.error({ companyId, toolVersionId, answer }, 'TOOL_WORKER_NOT_UPLOADED')
}

/** The upload of a `CODE` version of the company, read again from its row; none for any other id. */
async function workerOf(
  deps: Pick<ToolsDeps, 'database'>,
  companyId: CompanyId,
  toolVersionId: ToolVersionId,
): Promise<WorkerUpload | undefined> {
  const [row] = await deps.database.read(hubScope(companyId), (tx) =>
    tx
      .select({ toolId: tool.id, module: sql<unknown>`${toolVersion.config} ->> 'module'` })
      .from(toolVersion)
      .innerJoin(tool, eq(tool.id, toolVersion.toolId))
      .where(
        and(
          eq(toolVersion.id, toolVersionId),
          eq(toolVersion.companyId, companyId),
          eq(tool.kind, 'CODE'),
        ),
      ),
  )
  if (row === undefined || typeof row.module !== 'string') return undefined
  const ids = { companyId, toolId: ToolId.parse(row.toolId), toolVersionId }
  return uploadOf(ids, row.module)
}

/**
 * Uploads again the Worker of a `CODE` version of the company, for the call that found it gone:
 * `GONE` when the company holds no such version, `UNAVAILABLE` when Cloudflare did not take it.
 */
export async function reupload(
  deps: Pick<ToolsDeps, 'cloudflare' | 'database'>,
  companyId: CompanyId,
  toolVersionId: ToolVersionId,
): Promise<'UPLOADED' | 'NOT_STARTING' | 'GONE' | 'UNAVAILABLE'> {
  const upload = await workerOf(deps, companyId, toolVersionId)
  if (upload === undefined) return 'GONE'
  const sent = await deps.cloudflare.upload(upload)
  return sent.kind === 'DONE' ? sent.value : 'UNAVAILABLE'
}

/** The ids of a tool's `CODE` versions, or of every `CODE` version of the company. */
export async function codeVersionsOf(
  tx: ReadTx,
  of: { companyId: CompanyId; toolId?: ToolId },
): Promise<ToolVersionId[]> {
  const rows = await tx
    .select({ id: toolVersion.id })
    .from(toolVersion)
    .innerJoin(tool, eq(tool.id, toolVersion.toolId))
    .where(
      and(
        eq(tool.companyId, of.companyId),
        eq(tool.kind, 'CODE'),
        of.toolId === undefined ? undefined : eq(tool.id, of.toolId),
      ),
    )
  return rows.map((row) => ToolVersionId.parse(row.id))
}

/** Removes the versions' Workers by name, outside any transaction; one Cloudflare did not confirm is `TOOL_UNAVAILABLE`. */
export async function removedWorkers(
  deps: Pick<ToolsDeps, 'cloudflare'>,
  versionIds: readonly ToolVersionId[],
): Promise<number> {
  const { left } = await removeWorkers(deps.cloudflare, versionIds, toolWorkerOf)
  if (left > 0) throw new Failure('TOOL_UNAVAILABLE', { details: { workersLeft: left } })
  return versionIds.length
}

/**
 * The company's tool Workers, before its agents and library leave with it (step 24.4): one that
 * Cloudflare did not confirm keeps the company's deletion pending, and the deletion repeats.
 */
export async function removeCompanyWorkers(
  deps: Pick<ToolsDeps, 'cloudflare' | 'database'>,
  companyId: CompanyId,
): Promise<void> {
  const ids = await deps.database.read(hubScope(companyId), (tx) =>
    codeVersionsOf(tx, { companyId }),
  )
  const { left } = await removeWorkers(deps.cloudflare, ids, toolWorkerOf)
  if (left > 0) {
    throw new Failure('CLIENT_DELETION_PENDING', { details: { toolWorkersLeft: left } })
  }
}
