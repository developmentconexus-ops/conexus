import type { CompanyId, CopyId } from '@conexus/hub-api'
import { CompanyId as CompanyIdSchema, CopyId as CopyIdSchema } from '@conexus/hub-api'
import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'
import type { CopyRunEnd } from '../../hub/copies/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'

/**
 * Stored contract: every schedule row names this workflow, and Mastra deletes a row whose target
 * is missing after 3 ticks (as `AUTOMATION_WORKFLOW`): renaming it deletes every copy's schedule.
 */
export const COPY_WORKFLOW = 'conexus-copy-run'

/** What the schedule row's `inputData` keeps, parsed when a run starts and when the states are read (code C27). */
export const CopyInput = z.object({
  version: z.literal(1),
  companyId: CompanyIdSchema,
  copyId: CopyIdSchema,
  /** Only the weekly row has it: the run it starts reads every source from nothing. */
  whole: z.literal(true).optional(),
})
export type CopyInput = z.infer<typeof CopyInput>

const Ended = z.object({
  kind: z.enum(['RUNNING', 'GONE', 'ENDED', 'INPUT_UNREADABLE']),
  outcome: z.string().optional(),
})

type Deps = {
  copies: () => {
    run(
      input: { companyId: CompanyId; copyId: CopyId; whole: boolean },
      signal: AbortSignal,
    ): Promise<CopyRunEnd>
  }
  log: FailureLog
}

/**
 * One run of one copy, the target of each copy's schedule row: a step that parses the row's input
 * and calls the service's run. `autoRestartActiveRuns: false`: a Hub that restarts with a run open
 * does not drive it again, and the next run ends it `INTERRUPTED` (its lease runs out first). A
 * copy that is gone takes its schedule with it.
 */
export function copyRun(deps: Deps) {
  const run = createStep({
    id: 'run',
    inputSchema: z.unknown(),
    outputSchema: Ended,
    async execute({ inputData, runId, mastra, abortSignal }): Promise<z.infer<typeof Ended>> {
      const read = CopyInput.safeParse(inputData)
      if (!read.success) {
        logFailure(
          deps.log,
          new Failure('INTERNAL_UNEXPECTED', {
            details: { reason: 'COPY_INPUT', runId },
            cause: read.error,
          }),
        )
        return { kind: 'INPUT_UNREADABLE' }
      }
      const { companyId, copyId } = read.data
      const whole = read.data.whole === true
      const ended = await deps.copies().run({ companyId, copyId, whole }, abortSignal)
      if (ended.kind === 'GONE') {
        await mastra.schedules.delete(wholeScheduleIdOf(copyId))
        await mastra.schedules.delete(scheduleIdOf(copyId))
        return { kind: 'GONE' }
      }
      if (ended.kind === 'RUNNING' && whole) {
        deps.log.info({ companyId, copyId }, 'COPY_WHOLE_PASS_SKIPPED')
      }
      return ended.kind === 'ENDED'
        ? { kind: 'ENDED', outcome: ended.outcome.kind }
        : { kind: ended.kind }
    },
  })
  return createWorkflow({
    id: COPY_WORKFLOW,
    inputSchema: z.unknown(),
    outputSchema: Ended,
    options: { autoRestartActiveRuns: false },
  })
    .then(run)
    .commit()
}

/**
 * The id of a copy's schedule row: Mastra puts `schedule_` before the id a caller gives a workflow
 * schedule (`canonicalizeScheduleId`), and a bare id is looked up as an agent's.
 */
export function scheduleIdOf(copyId: CopyId): string {
  return `schedule_${copyId}`
}

/** The weekly row's id: Mastra's `slugify` turns an underscore suffix into a hyphen, so the suffix is already one. */
export function wholeScheduleIdOf(copyId: CopyId): string {
  return `${scheduleIdOf(copyId)}-whole`
}
