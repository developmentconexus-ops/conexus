import type { ConnectionId } from '@conexus/hub-api'
import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'
import type { CompanyScope, FullPassFire, StartAnswer } from '../../hub/copies/public.ts'
import { companyScope } from '../../hub/copies/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import { COPY_WORKFLOW } from '../mastra/public.ts'
import { ClockInput, clockIdsOf } from './clock.ts'

const Fired = z.object({
  kind: z.enum(['QUEUED', 'ALREADY_RUNNING', 'NO_COPY', 'PASS_OFF', 'INPUT_UNREADABLE']),
})

type Deps = {
  start: (at: CompanyScope, connection: ConnectionId, cause: 'CLOCK') => Promise<StartAnswer>
  markFullPass: (at: CompanyScope, connection: ConnectionId) => Promise<FullPassFire>
  log: FailureLog
}

/**
 * The target of every connection's clock row: one step that calls `iniciarRodada` and ends when it
 * answers; no copy runs inside the workflow, and the round's end is the queue's (Relógio). The full
 * pass's row marks the pass due first, so a round that does not read it leaves it to a later one,
 * and asks for no round when the copy runs no full pass. A connection whose copy is gone takes its
 * clocks with it.
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
      const { companyId, connectionId, pass } = read.data
      const at = companyScope(companyId)
      if (pass === 'FULL' && (await deps.markFullPass(at, connectionId)) === 'PASS_OFF')
        return { kind: 'PASS_OFF' }
      const answer = await deps.start(at, connectionId, 'CLOCK')
      if (answer.kind === 'NO_COPY')
        for (const id of clockIdsOf(connectionId)) await mastra.schedules.delete(id)
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
