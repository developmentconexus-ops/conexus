import { WorkflowId } from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import { and, eq } from 'drizzle-orm'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { ReleaseScope } from '../controller-kit/public.ts'
import { dropWorkflow } from './definitions.ts'
import { workflow } from './tables.ts'

/**
 * Drops the definitions of the workflows of a company or of one Projeto, before their rows go (data
 * D17), so a failure halfway leaves rows the next removal finds. A person's leaving removes none:
 * the workflow keeps its draft and loses only the authorship ids.
 */
export async function releaseWorkflows(
  deps: { database: Database; mastra: Mastra; log: FailureLog },
  scope: ReleaseScope,
): Promise<void> {
  if (scope.personId !== undefined && scope.projectId === undefined) return
  const { companyId, projectId } = scope
  const rows = await deps.database.read({ kind: 'COMPANY', companyId, personId: null }, (tx) =>
    tx
      .select({ id: workflow.id })
      .from(workflow)
      .where(
        projectId === undefined
          ? eq(workflow.companyId, companyId)
          : and(eq(workflow.companyId, companyId), eq(workflow.projectId, projectId)),
      ),
  )
  let count = 0
  for (const row of rows) count += await dropWorkflow(deps.mastra, WorkflowId.parse(row.id))
  deps.log.info({ companyId, count }, 'WORKFLOW_DEFINITIONS_RELEASED')
}
