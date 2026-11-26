import type { ConnectionId } from '@conexus/hub-api'
import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'
import type { CompanyScope, StartAnswer } from '../../hub/copies/public.ts'
import { companyScope } from '../../hub/copies/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import { COPY_WORKFLOW } from '../mastra/public.ts'
import { ClockInput, clockIdOf } from './clock.ts'

const Fired = z.object({
  kind: z.enum(['QUEUED', 'ALREADY_RUNNING', 'NO_COPY', 'INPUT_UNREADABLE']),
})

type Deps = {
  start: (at: CompanyScope, connection: ConnectionId, cause: 'CLOCK') => Promise<StartAnswer>
  log: FailureLog
}

/**
 * The target of every connection's clock row: one step that calls `iniciarRodada` and ends when it
 * answers; no copy runs inside the workflow, and the round's end is the queue's (Relógio). A
 * connection whose copy is gone takes its clock with it.
 */
export function copyClockWorkflow(deps: Deps) {
  const fire = createStep({
    id: 'start',
    inputSchema: z.unknown(),
    outputSchema: Fired,
    async execute({ inputData, runId, mastra }): Promise<z.infer<typeof Fired>> {
      const read = ClockInput.safeParse(inputData)
      if (!read.success) {
        logFailure(
          deps.log,
          new Failure('INTERNAL_UNEXPECTED', {
            details: { reason: 'LAKE_CLOCK_INPUT', runId },
            cause: read.error,
          }),
        )
        return { kind: 'INPUT_UNREADABLE' }
      }
      const { companyId, connectionId } = read.data
      const answer = await deps.start(companyScope(companyId), connectionId, 'CLOCK')
      if (answer.kind === 'NO_COPY') await mastra.schedules.delete(clockIdOf(connectionId))
      return { kind: answer.kind }
    },
  })
  return createWorkflow({
    id: COPY_WORKFLOW,
    inputSchema: z.unknown(),
    outputSchema: Fired,
    options: { autoRestartActiveRuns: false },
  })
    .then(fire)
    .commit()
}
