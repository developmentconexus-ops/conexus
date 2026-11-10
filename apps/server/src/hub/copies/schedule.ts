import type { CopyId, CopyInterval } from '@conexus/hub-api'
import { COPY_INTERVAL_DEFAULT } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import { Failure } from '../../platform/failure.ts'
import { summaries } from './list.ts'
import type { CopiesDeps, InCompany } from './store.ts'
import { personScope } from './store.ts'
import { copy } from './tables.ts'

type Of = InCompany & { copyId: CopyId }

/**
 * The copy admitted for a change (`manageCopies`) and alive; its lease read at the same instant the
 * Hub's clock reads it, so `live` is whether a run holds it now.
 */
async function admitted(deps: CopiesDeps, input: Of) {
  return deps.database.command(personScope(input), async (tx) => {
    await deps.identity.admitMember({ tx, ...input, action: 'manageCopies' })
    const [row] = await tx
      .select({ live: sql<boolean | null>`${copy.claimedUntil} > statement_timestamp()` })
      .from(copy)
      .where(and(eq(copy.id, input.copyId), eq(copy.companyId, input.companyId)))
    if (row === undefined) throw new Failure('COPY_NOT_FOUND')
    return { live: row.live === true }
  })
}

async function stateOf(deps: CopiesDeps, input: Of) {
  return (await deps.clock().states(input.companyId)).get(input.copyId)
}

/** A schedule made while the scheduler is stopping would start it again (as an automation's). */
function mayCreate(deps: CopiesDeps) {
  if (deps.updating()) throw new Failure('HUB_UPDATING')
}

/** Pausar: a copy with no schedule has nothing to pause; doing it again changes nothing. */
export async function pauseCopy(deps: CopiesDeps, input: Of) {
  await admitted(deps, input)
  if ((await stateOf(deps, input)) !== undefined) await deps.clock().pause(input.copyId)
  const { companyId, copyId } = input
  deps.log.info({ companyId, copyId }, 'COPY_PAUSED')
  return one(deps, input)
}

/** Retomar: the schedule resumed from its next time, or, with none, made with the default interval. */
export async function resumeCopy(deps: CopiesDeps, input: Of) {
  await admitted(deps, input)
  // `resume` does not start a stopped scheduler, but its row would fire at the next start.
  if (deps.updating()) throw new Failure('HUB_UPDATING')
  const { companyId, copyId } = input
  if ((await stateOf(deps, input)) === undefined) {
    await deps.clock().set({ companyId, copyId, interval: COPY_INTERVAL_DEFAULT })
  } else {
    await deps.clock().resume(copyId)
  }
  deps.log.info({ companyId, copyId }, 'COPY_RESUMED')
  return one(deps, input)
}

/** Mudar o intervalo: a paused schedule stays paused; a missing one is made active with the interval. */
export async function changeInterval(deps: CopiesDeps, input: Of & { interval: CopyInterval }) {
  await admitted(deps, input)
  const { companyId, copyId, interval } = input
  if ((await stateOf(deps, input)) === undefined) mayCreate(deps)
  await deps.clock().set({ companyId, copyId, interval })
  deps.log.info({ companyId, copyId, interval }, 'COPY_INTERVAL_CHANGED')
  return one(deps, input)
}

/** Rodar agora: paused or not, unless a run holds the lease; the run itself is the workflow's. */
export async function runNow(deps: CopiesDeps, input: Of): Promise<void> {
  const { live } = await admitted(deps, input)
  // `schedules.run` publishes even with the scheduler stopped.
  if (deps.updating()) throw new Failure('HUB_UPDATING')
  if (live) throw new Failure('COPY_RUNNING')
  // The card names no run for a copy with no schedule (it is resumed first): an open decision, answered as not found.
  if ((await stateOf(deps, input)) === undefined)
    throw new Failure('COPY_NOT_FOUND', { details: { reason: 'NO_SCHEDULE' } })
  await deps.clock().runNow(input.copyId)
  const { companyId, copyId } = input
  deps.log.info({ companyId, copyId }, 'COPY_RUN_REQUESTED')
}

async function one(deps: CopiesDeps, input: Of) {
  const [summary] = await summaries(deps, input, input.copyId)
  if (summary === undefined) throw new Failure('COPY_NOT_FOUND')
  return summary
}

export { one as summaryOf }
