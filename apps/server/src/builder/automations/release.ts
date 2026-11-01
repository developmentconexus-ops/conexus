import type { Mastra } from '@mastra/core/mastra'
import { databaseFailure } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { assistantOwner } from '../assistant/public.ts'
import type { ReleaseScope } from '../conversation/public.ts'
import { AUTOMATION_WORKFLOW, AutomationInput } from './run.ts'

/** A call to Mastra's storage, its failure read by the database's map (code C52). */
export async function stored<T>(work: Promise<T>): Promise<T> {
  try {
    return await work
  } catch (error) {
    throw databaseFailure(error)
  }
}

/**
 * The runs of one automation, which keep its `inputData` (its question, its name, its
 * connections) after its row goes: the owner's runs of the workflow, those of this automation by
 * the prefix of their id.
 */
export async function deleteRunsOf(mastra: Mastra, input: AutomationInput): Promise<void> {
  const workflow = mastra.getWorkflow(AUTOMATION_WORKFLOW)
  const { runs } = await stored(
    workflow.listWorkflowRuns({
      workflowName: AUTOMATION_WORKFLOW,
      resourceId: assistantOwner(input),
      perPage: false,
    }),
  )
  const prefix = `sched_${input.automationId}_`
  for (const run of runs) {
    if (run.runId.startsWith(prefix)) await stored(workflow.deleteWorkflowRunById(run.runId))
  }
}

function released(input: AutomationInput, scope: ReleaseScope): boolean {
  if (input.companyId !== scope.companyId) return false
  if (scope.personId !== undefined && input.personId !== scope.personId) return false
  if (scope.projectId === undefined) return true
  return input.place.kind === 'PROJECT' && input.place.projectId === scope.projectId
}

/**
 * Deletes the automations of a company, of one person of it, or of one Projeto of it, and their
 * runs (data D17), before the conversations, so no run opens one the removal misses; one at a
 * time, and a failure halfway leaves what the next removal finds again.
 */
export async function releaseAutomations(
  deps: { mastra: Mastra; log: FailureLog },
  scope: ReleaseScope,
): Promise<void> {
  const { schedules } = deps.mastra
  const rows = await stored(schedules.list({ workflowId: AUTOMATION_WORKFLOW }))
  let count = 0
  for (const row of rows) {
    const input = AutomationInput.safeParse(
      row.workflowId === AUTOMATION_WORKFLOW ? row.inputData : null,
    )
    if (!input.success || !released(input.data, scope)) continue
    await stored(schedules.delete(row.id))
    await deleteRunsOf(deps.mastra, input.data)
    count += 1
  }
  deps.log.info({ companyId: scope.companyId, count }, 'AUTOMATIONS_RELEASED')
}
