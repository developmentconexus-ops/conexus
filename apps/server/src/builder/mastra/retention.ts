import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'

/** Mastra keeps the schedule under this workflow id: a new id is a new schedule. */
export const RETENTION_WORKFLOW = 'conexus-retention-prune'

const Pruned = z.object({ done: z.boolean() })

const prune = createStep({
  id: 'prune',
  inputSchema: z.object({}).optional(),
  outputSchema: Pruned,
  async execute({ mastra }) {
    const storage = mastra.getStorage()
    if (storage === undefined) throw new Error('the Hub runs Mastra on a store')
    const results = await storage.prune({ maxRows: 50_000 })
    return { done: results.every((each) => each.done) }
  },
})

/**
 * Drops the traces past their age once a day, at 03:30 in São Paulo (decision 0068): the age lives
 * in the store's `retention`, and Mastra never prunes by itself (`reference-storage-retention.md`).
 */
export const retentionRun = createWorkflow({
  id: RETENTION_WORKFLOW,
  inputSchema: z.object({}).optional(),
  outputSchema: Pruned,
  schedule: { cron: '30 3 * * *', timezone: 'America/Sao_Paulo' },
})
  .then(prune)
  .commit()
