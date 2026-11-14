import type { CompanyId, InventoryRunId } from '@conexus/hub-api'
import {
  CompanyId as CompanyIdSchema,
  InventoryRunId as InventoryRunIdSchema,
} from '@conexus/hub-api'
import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'
import type { InventoryEnd } from '../../hub/ontology/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'

/** Stored contract, like `COPY_WORKFLOW`: a run in flight names this workflow. */
export const INVENTORY_WORKFLOW = 'conexus-source-inventory'

/** What a run's input keeps, parsed when the step runs (code C27). */
const InventoryInput = z.object({
  version: z.literal(1),
  companyId: CompanyIdSchema,
  runId: InventoryRunIdSchema,
})

const Ended = z.object({
  kind: z.enum(['COMPLETE', 'PARTIAL', 'FAILED', 'GONE', 'INPUT_UNREADABLE']),
})

type Deps = {
  ontology: () => {
    run(
      input: { companyId: CompanyId; runId: InventoryRunId },
      signal: AbortSignal,
    ): Promise<InventoryEnd>
  }
  log: FailureLog
}

/**
 * One reading of a connection's inventory, with no model: a step that parses the input and calls
 * the Ontology's run. `autoRestartActiveRuns: false`: a Hub that restarts with a run open does not
 * drive it again, and the next opening ends it `INTERRUPTED` when its lease has run out.
 */
export function inventoryRun(deps: Deps) {
  const run = createStep({
    id: 'run',
    inputSchema: z.unknown(),
    outputSchema: Ended,
    async execute({ inputData, runId, abortSignal }): Promise<z.infer<typeof Ended>> {
      const read = InventoryInput.safeParse(inputData)
      if (!read.success) {
        logFailure(
          deps.log,
          new Failure('INTERNAL_UNEXPECTED', {
            details: { reason: 'INVENTORY_INPUT', runId },
            cause: read.error,
          }),
        )
        return { kind: 'INPUT_UNREADABLE' }
      }
      const ended = await deps.ontology().run(read.data, abortSignal)
      return { kind: ended.kind }
    },
  })
  return createWorkflow({
    id: INVENTORY_WORKFLOW,
    inputSchema: z.unknown(),
    outputSchema: Ended,
    options: { autoRestartActiveRuns: false },
  })
    .then(run)
    .commit()
}
