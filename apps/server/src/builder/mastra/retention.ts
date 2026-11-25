import type { MastraCompositeStore } from '@mastra/core/storage'
import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { RETENTION_DAYS } from '../conversation/public.ts'

/** Mastra keeps the schedule under this workflow id: a new id is a new schedule. */
export const RETENTION_WORKFLOW = 'conexus-retention-prune'

export const COPY_WORKFLOW = 'conexus-copy-run'

/** The most rows one run drops; a day that would pass it waits for the next run. */
const PRUNE_MAX_ROWS = 50_000

/** The store the Hub runs Mastra on; its absence is one failure wherever it is found. */
export function storageOf(mastra: {
  getStorage(): MastraCompositeStore | undefined
}): MastraCompositeStore {
  const storage = mastra.getStorage()
  if (storage === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'MASTRA_STORAGE_MISSING' } })
  }
  return storage
}

const DAY_MS = 86_400_000

/**
 * Drops the copy workflow's runs older than the retention age, one by one. The `workflowSnapshot`
 * policy would take the Assistant's automation runs too, which the Hub reads
 * (`automations/runs.ts`), so the runs go by workflow name. Returns whether none older is left.
 */
export async function pruneCopyRuns(
  storage: MastraCompositeStore,
  options: { maxRows: number; now?: number },
): Promise<{ done: boolean }> {
  const workflows = await storage.getStore('workflows')
  if (workflows === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'MASTRA_STORE_MISSING' } })
  }
  const olderThan = new Date((options.now ?? Date.now()) - RETENTION_DAYS * DAY_MS)
  const { runs } = await workflows.listWorkflowRuns({
    workflowName: COPY_WORKFLOW,
    toDate: olderThan,
    perPage: options.maxRows + 1,
    page: 0,
    summary: true,
  })
  for (const run of runs.slice(0, options.maxRows)) {
    await workflows.deleteWorkflowRunById({ runId: run.runId, workflowName: COPY_WORKFLOW })
  }
  return { done: runs.length <= options.maxRows }
}

const Pruned = z.object({ done: z.boolean() })

/**
 * Drops the traces, the clock's fire history and the copy's runs past their age once a day, at 03:30 in São Paulo (decision 0068): the age lives
 * in the store's `retention`, and Mastra never prunes by itself (`reference-storage-retention.md`).
 * A run that stopped at its row budget leaves a line, which names the step and carries no data.
 */
export function retentionOf(deps: { log: FailureLog; maxRows?: number }) {
  const prune = createStep({
    id: 'prune',
    inputSchema: z.object({}).optional(),
    outputSchema: Pruned,
    async execute({ mastra }) {
      const storage = storageOf(mastra)
      const maxRows = deps.maxRows ?? PRUNE_MAX_ROWS
      const results = await storage.prune({ maxRows })
      const copyRuns = await pruneCopyRuns(storage, { maxRows })
      const done = results.every((each) => each.done) && copyRuns.done
      if (!done) deps.log.info({ step: 'prune' }, 'RETENTION_STILL_DRAINING')
      return { done }
    },
  })
  return createWorkflow({
    id: RETENTION_WORKFLOW,
    inputSchema: z.object({}).optional(),
    outputSchema: Pruned,
    schedule: { cron: '30 3 * * *', timezone: 'America/Sao_Paulo' },
  })
    .then(prune)
    .commit()
}
