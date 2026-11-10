import type { CompanyId, CopyId, CopyInterval, CopySchedule } from '@conexus/hub-api'
import { CompanyId as CompanyIdSchema, CopyInterval as CopyIntervalSchema } from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import { z } from 'zod'
import type { CopyClock, CopyState } from '../../hub/copies/public.ts'
import { databaseFailure } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { ReleaseScope } from '../controller-kit/public.ts'
import { COPY_WORKFLOW, CopyInput, scheduleIdOf } from './workflow.ts'

/** Every copy's schedule is read in São Paulo, as the automations'. */
const COPY_TIMEZONE = 'America/Sao_Paulo'

/** The only place the intervals are crons (code C26). */
const CRONS = {
  '15m': '*/15 * * * *',
  '30m': '*/30 * * * *',
  '1h': '0 * * * *',
  '2h': '0 */2 * * *',
  '6h': '0 */6 * * *',
  '24h': '0 3 * * *',
} as const satisfies Record<CopyInterval, string>

/** What the row's `metadata` keeps beside its `inputData`: the company, for the list of its copies, and the interval chosen. */
const Metadata = z.object({ companyId: CompanyIdSchema, interval: CopyIntervalSchema })

/** A call to Mastra's storage, its failure read by the database's map (code C52). */
async function stored<T>(work: Promise<T>): Promise<T> {
  try {
    return await work
  } catch (error) {
    throw databaseFailure(error)
  }
}

type Row = Awaited<ReturnType<Mastra['schedules']['get']>>

/** A copy's schedule row, with what it is; a row of another workflow, or unreadable, is none. */
function ownedOf(row: Row, log: FailureLog) {
  if (row?.workflowId !== COPY_WORKFLOW) return undefined
  const input = CopyInput.safeParse(row.inputData)
  const metadata = Metadata.safeParse(row.metadata)
  if (input.success && metadata.success) return { row, input: input.data, metadata: metadata.data }
  log.error({ scheduleId: row.id }, 'COPY_SCHEDULE_UNREADABLE')
  return undefined
}

function stateOf(owned: NonNullable<ReturnType<typeof ownedOf>>): CopyState {
  const schedule: CopySchedule =
    owned.row.status === 'active'
      ? { kind: 'ACTIVE', nextRunAt: new Date(owned.row.nextFireAt).toISOString() }
      : { kind: 'PAUSED' }
  return { schedule, interval: owned.metadata.interval }
}

/** The copies' clock on `mastra.schedules`: one schedule row for each copy, with nothing of its own beside them. */
export function createCopyClock(deps: { mastra: Mastra; log: FailureLog }): CopyClock {
  const { schedules } = deps.mastra
  async function update(id: string, patch: { cron: string; metadata: Metadata }) {
    await stored(schedules.update(id, patch))
  }
  return {
    async set({ companyId, copyId, interval }) {
      const id = scheduleIdOf(copyId)
      const metadata = { companyId, interval }
      const cron = CRONS[interval]
      // `update` keeps a pause (the study's P1).
      if (ownedOf(await stored(schedules.get(id)), deps.log) !== undefined)
        return update(id, { cron, metadata })
      try {
        await schedules.create({
          ...{ id, workflowId: COPY_WORKFLOW, cron, timezone: COPY_TIMEZONE, metadata },
          inputData: { version: 1, companyId, copyId },
        })
      } catch (error) {
        // No stable field tells a race lost at the row's id (code C52): the row read again is the race.
        if (ownedOf(await stored(schedules.get(id)), deps.log) === undefined)
          throw databaseFailure(error)
        await update(id, { cron, metadata })
      }
    },
    async pause(copyId) {
      await stored(schedules.pause(scheduleIdOf(copyId)))
    },
    async resume(copyId) {
      await stored(schedules.resume(scheduleIdOf(copyId)))
    },
    async runNow(copyId) {
      await stored(schedules.run(scheduleIdOf(copyId)))
    },
    async remove(copyId) {
      await stored(schedules.delete(scheduleIdOf(copyId)))
    },
    async states(companyId: CompanyId) {
      const rows = await stored(schedules.list({ workflowId: COPY_WORKFLOW }))
      const found = new Map<CopyId, CopyState>()
      for (const row of rows) {
        const owned = ownedOf(row, deps.log)
        if (owned?.input.companyId === companyId) found.set(owned.input.copyId, stateOf(owned))
      }
      return found
    },
  }
}
type Metadata = z.infer<typeof Metadata>

/**
 * Deletes the schedules of a company's copies, before the rows (criterion 29): a removal of a
 * company only; a person's or a Projeto's removal leaves the company's copies alone.
 */
export async function releaseCopies(
  deps: { clock: CopyClock; log: FailureLog },
  scope: ReleaseScope,
): Promise<void> {
  if (scope.personId !== undefined || scope.projectId !== undefined) return
  const states = await deps.clock.states(scope.companyId)
  for (const copyId of states.keys()) await deps.clock.remove(copyId)
  deps.log.info({ companyId: scope.companyId, count: states.size }, 'COPY_SCHEDULES_RELEASED')
}
