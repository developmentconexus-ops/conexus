import type { ConnectionId, LakeInterval } from '@conexus/hub-api'
import {
  CompanyId as CompanyIdSchema,
  ConnectionId as ConnectionIdSchema,
  LakeInterval as LakeIntervalSchema,
} from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import { z } from 'zod'
import type { ScheduledCopy } from '../../hub/copies/public.ts'
import { COPY_TIMEZONE, runningPass } from '../../hub/copies/public.ts'
import { databaseFailure } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { COPY_WORKFLOW } from '../mastra/public.ts'
import type { ReleaseScope } from '../spec/public.ts'

export { COPY_TIMEZONE }

type Clocked = Exclude<LakeInterval, 'MANUAL'>

const STEPS = {
  '15m': { minutes: 15 },
  '30m': { minutes: 30 },
  '1h': { hours: 1 },
  '2h': { hours: 2 },
  '6h': { hours: 6 },
  '24h': { hours: 24 },
} as const satisfies Record<Clocked, { minutes: number } | { hours: number }>

const SAO_PAULO = new Intl.DateTimeFormat('en-GB', {
  timeZone: COPY_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function clockOf(anchor: Date): { hour: number; minute: number } {
  const parts = SAO_PAULO.formatToParts(anchor)
  function part(type: 'hour' | 'minute') {
    return Number(parts.find((each) => each.type === type)?.value ?? Number.NaN)
  }
  return { hour: part('hour'), minute: part('minute') }
}

/**
 * The cron of a connection's copy, counted from the minute and hour its copy was born in São Paulo
 * (T.38, Relógio): 10:07 at 15 minutes is `7,22,37,52 * * * *`, at 24 hours `7 10 * * *`; 11:07 at
 * 2 hours is `7 1-23/2 * * *`.
 */
export function cronOf(interval: Clocked, anchor: Date): string {
  const { hour, minute } = clockOf(anchor)
  const step = STEPS[interval]
  if ('minutes' in step) {
    const minutes = Array.from(
      { length: 60 / step.minutes },
      (_, at) => (minute % step.minutes) + at * step.minutes,
    )
    return `${minutes.join(',')} * * * *`
  }
  if (step.hours === 1) return `${minute} * * * *`
  if (step.hours === 24) return `${minute} ${hour} * * *`
  return `${minute} ${hour % step.hours}-23/${step.hours} * * *`
}

type FullPass = NonNullable<ReturnType<typeof runningPass>>

const FULL_DAYS = { WEEKLY: '0', DAILY: '*' } as const satisfies Record<FullPass, string>
/** The source's quiet hour, in São Paulo (firstmate F3). */
const FULL_HOUR = 3

function fullCronOf(pass: FullPass, anchor: Date): string {
  return `${clockOf(anchor).minute} ${FULL_HOUR} * * ${FULL_DAYS[pass]}`
}

const Target = z.object({ companyId: CompanyIdSchema, connectionId: ConnectionIdSchema })

/** What the row's `inputData` keeps: whose round it starts and which of its two rows it is (code C27). */
export const ClockInput = z.union([
  Target.extend({ version: z.literal(2), pass: z.enum(['ROUND', 'FULL']) }),
  // A row made before the full pass existed is the common round's.
  Target.extend({ version: z.literal(1) }).transform((row) => ({ ...row, pass: 'ROUND' as const })),
])
type Pass = z.infer<typeof ClockInput>['pass']
const Metadata = z.object({ companyId: CompanyIdSchema, interval: LakeIntervalSchema })

/**
 * The id of a connection's clock row: Mastra puts `schedule_` before the id given to a workflow
 * schedule (`canonicalizeScheduleId`), so the id carries it already.
 */
function clockIdOf(connection: ConnectionId): string {
  return `schedule_${connection}`
}

function fullClockIdOf(connection: ConnectionId): string {
  return `${clockIdOf(connection)}-full`
}

export function clockIdsOf(connection: ConnectionId): readonly string[] {
  return [clockIdOf(connection), fullClockIdOf(connection)]
}

type ClockRow = Readonly<{ id: string; pass: Pass; cron: string | null }>

function rowsOf(copy: ScheduledCopy): readonly ClockRow[] {
  const { connectionId, interval, anchor } = copy
  const full = runningPass(copy)
  return [
    {
      id: clockIdOf(connectionId),
      pass: 'ROUND',
      cron: interval === 'MANUAL' ? null : cronOf(interval, anchor),
    },
    {
      id: fullClockIdOf(connectionId),
      pass: 'FULL',
      cron: full === null ? null : fullCronOf(full, anchor),
    },
  ]
}

async function stored<T>(work: Promise<T>): Promise<T> {
  try {
    return await work
  } catch (error) {
    throw databaseFailure(error)
  }
}

type Row = Awaited<ReturnType<Mastra['schedules']['get']>>

function ownedOf(row: Row, log: FailureLog) {
  if (row?.workflowId !== COPY_WORKFLOW) return undefined
  const input = ClockInput.safeParse(row.inputData)
  const metadata = Metadata.safeParse(row.metadata)
  if (input.success && metadata.success) return { row, input: input.data, metadata: metadata.data }
  log.error({ scheduleId: row.id }, 'LAKE_CLOCK_UNREADABLE')
  return undefined
}

/**
 * The connections' clocks on `mastra.schedules`, found by the connection's id: a row for the common
 * round of each copy that is not MANUAL and one for its full pass when it runs one; a row only says
 * when (Relógio).
 */
export function createLakeClock(deps: { mastra: Mastra; log: FailureLog }) {
  const { schedules } = deps.mastra
  async function owned(id: string) {
    return ownedOf(await stored(schedules.get(id)), deps.log)
  }
  async function ownedRows() {
    const rows = await stored(schedules.list({ workflowId: COPY_WORKFLOW }))
    return rows.flatMap((row) => ownedOf(row, deps.log) ?? [])
  }

  async function keep(copy: ScheduledCopy, { id, pass, cron }: ClockRow): Promise<void> {
    if (cron === null) {
      await stored(schedules.delete(id))
      return
    }
    const { companyId, connectionId, interval } = copy
    const metadata = { companyId, interval }
    if ((await owned(id)) !== undefined) {
      await stored(schedules.update(id, { cron, metadata }))
      return
    }
    try {
      await schedules.create({
        ...{ id, workflowId: COPY_WORKFLOW, cron, timezone: COPY_TIMEZONE, metadata },
        inputData: { version: 2, companyId, connectionId, pass },
      })
    } catch (error) {
      // No stable field tells a race lost at the row's id (code C52): the row read again is the race.
      if ((await owned(id)) === undefined) throw databaseFailure(error)
      await stored(schedules.update(id, { cron, metadata }))
    }
  }

  async function set(copy: ScheduledCopy): Promise<void> {
    for (const row of rowsOf(copy)) await keep(copy, row)
  }

  async function nextOf(id: string): Promise<Date | null> {
    const found = await owned(id)
    return found === undefined || found.row.status !== 'active'
      ? null
      : new Date(found.row.nextFireAt)
  }

  return Object.freeze({
    set,
    async remove(connection: ConnectionId): Promise<void> {
      for (const id of clockIdsOf(connection)) await stored(schedules.delete(id))
    },
    next: (connection: ConnectionId) => nextOf(clockIdOf(connection)),
    fullNext: (connection: ConnectionId) => nextOf(fullClockIdOf(connection)),
    /**
     * At the Hub's start: the rows each copy runs, and none for a connection that left; the copies
     * of every company come from the Hub's database.
     */
    async reconcile(copies: readonly ScheduledCopy[]): Promise<void> {
      for (const copy of copies) await set(copy)
      const wanted = copies.flatMap(rowsOf).filter((row) => row.cron !== null)
      const kept = new Set(wanted.map((row) => row.id))
      for (const found of await ownedRows())
        if (!kept.has(found.row.id)) await stored(schedules.delete(found.row.id))
    },
    /** The removal of a company takes its connections' clocks; a person's or a Projeto's leaves them. */
    async release(scope: ReleaseScope): Promise<void> {
      if (scope.personId !== undefined || scope.projectId !== undefined) return
      let count = 0
      for (const found of await ownedRows()) {
        if (found.input.companyId !== scope.companyId) continue
        await stored(schedules.delete(found.row.id))
        count += 1
      }
      deps.log.info({ companyId: scope.companyId, count }, 'LAKE_CLOCKS_RELEASED')
    },
  })
}

export type LakeClock = ReturnType<typeof createLakeClock>
