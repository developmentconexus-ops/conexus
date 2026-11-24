import type { MastraCompositeStore } from '@mastra/core/storage'
import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'

/** Mastra keeps the schedule under this workflow id: a new id is a new schedule. */
export const RETENTION_WORKFLOW = 'conexus-retention-prune'

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

const Pruned = z.object({ done: z.boolean() })

/**
 * Drops the traces past their age once a day, at 03:30 in São Paulo (decision 0068): the age lives
 * in the store's `retention`, and Mastra never prunes by itself (`reference-storage-retention.md`).
 * A run that stopped at its row budget leaves a line, which names the step and carries no data.
 */
export function retentionOf(deps: { log: FailureLog; maxRows?: number }) {
  const prune = createStep({
    id: 'prune',
    inputSchema: z.object({}).optional(),
    outputSchema: Pruned,
    async execute({ mastra }) {
      const results = await storageOf(mastra).prune({ maxRows: deps.maxRows ?? PRUNE_MAX_ROWS })
      const done = results.every((each) => each.done)
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
