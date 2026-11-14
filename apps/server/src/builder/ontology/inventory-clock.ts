import type { Mastra } from '@mastra/core/mastra'
import type { InventoryClock } from '../../hub/ontology/public.ts'
import { INVENTORY_WORKFLOW } from './inventory-workflow.ts'

/** The inventory's clock on the Hub's one `Mastra`: a run of the workflow, started and left to run on its own. */
export function createInventoryClock(deps: { mastra: Mastra }): InventoryClock {
  return {
    async start({ companyId, runId }) {
      const run = await deps.mastra.getWorkflow(INVENTORY_WORKFLOW).createRun()
      await run.startAsync({ inputData: { version: 1, companyId, runId } })
    },
  }
}
