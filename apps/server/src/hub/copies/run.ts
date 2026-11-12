import { randomUUID } from 'node:crypto'
import { CopyRunId } from '@conexus/hub-api'
import { and, desc, eq, isNull, lt, notInArray, or, sql } from 'drizzle-orm'
import { connectionNamesOf } from '../connectors/public.ts'
import type { Claimed, Counts, Ids, Run, SourceStep } from './source-pass.ts'
import { DATABASE_DOWN, lost, netDropped, sourcePass, WAIT } from './source-pass.ts'
import type { StoredSource } from './sources.ts'
import { datedPasses, sourcesOf } from './sources.ts'
import type { CopiesDeps, CopyOutcome, CopyRunEnd, CopyTuning } from './store.ts'
import { companyScope, copyTableOf, parsedCopy, syncOf } from './store.ts'
import { copy, copyRun } from './tables.ts'

/** Production's ceilings of one run (code C26): 500 rows a page, 200 pages or 10 minutes, a lease of 10 minutes renewed at each page. */
export const RUN_DEFAULTS = {
  pageRows: 500,
  runPages: 200,
  runMs: 10 * 60_000,
  leaseMs: 10 * 60_000,
} as const satisfies Required<CopyTuning>

/** The newest runs of each copy kept; older ones go when a run ends. */
const KEPT_RUNS = 100

function leaseFrom(deps: CopiesDeps) {
  return sql`statement_timestamp() + ${deps.tuning.leaseMs} * interval '1 millisecond'`
}

/**
 * The lease taken in one Hub transaction (data D25): only when none is held or it ran out, decided
 * by the `UPDATE` itself (code C65). The open run a lost holder left ends `INTERRUPTED`, and the new
 * one begins; each source's open pass keeps the instant it began, and one with none begins now.
 */
async function claim(deps: CopiesDeps, ids: Ids) {
  const token = randomUUID()
  const same = and(eq(copy.id, ids.copyId), eq(copy.companyId, ids.companyId))
  return deps.database.command(companyScope(ids.companyId), async (tx) => {
    const [row] = await tx
      .update(copy)
      .set({ claimToken: token, claimedUntil: leaseFrom(deps) })
      .where(
        and(same, or(isNull(copy.claimedUntil), lt(copy.claimedUntil, sql`statement_timestamp()`))),
      )
      .returning()
    if (row === undefined) {
      const [found] = await tx.select({ id: copy.id }).from(copy).where(same)
      return found === undefined ? ({ kind: 'GONE' } as const) : ({ kind: 'RUNNING' } as const)
    }
    await tx
      .update(copyRun)
      .set({ endedAt: sql`statement_timestamp()`, outcome: 'INTERRUPTED' })
      .where(and(eq(copyRun.copyId, ids.copyId), isNull(copyRun.endedAt)))
    const runId = CopyRunId.parse(randomUUID())
    await tx.insert(copyRun).values({ id: runId, ...ids, startedAt: sql`statement_timestamp()` })
    await datedPasses(tx, ids)
    const sources = await sourcesOf(tx, ids)
    const claimed: Claimed = {
      copy: parsedCopy(row),
      holder: { ...ids, token, runId },
      sync: await syncOf(deps, tx, ids.companyId),
      sources,
      names: await connectionNamesOf(tx, {
        companyId: ids.companyId,
        ids: sources.map((source) => source.connectionId),
      }),
    }
    return { kind: 'CLAIMED', ...claimed } as const
  })
}

function held(claimed: Claimed) {
  return and(eq(copy.id, claimed.holder.copyId), eq(copy.claimToken, claimed.holder.token))
}

function reasonOf(outcome: CopyOutcome): string | null {
  switch (outcome.kind) {
    case 'COMPLETE':
    case 'INTERRUPTED':
      return null
    case 'PARTIAL':
      return outcome.reason
    case 'ERROR':
      return outcome.code
    default:
      return outcome satisfies never
  }
}

/** The end: the lease let go, the run's row closed and pointed at, the runs past the newest 100 gone. */
async function ended(
  deps: CopiesDeps,
  claimed: Claimed,
  outcome: CopyOutcome,
  counts: Counts & { started: number },
): Promise<CopyRunEnd> {
  const { companyId, id: copyId } = claimed.copy
  const done = await deps.database.command(companyScope(companyId), async (tx) => {
    const [row] = await tx
      .update(copy)
      .set({ claimToken: null, claimedUntil: null, lastRunId: claimed.holder.runId })
      .where(held(claimed))
      .returning({ id: copy.id })
    if (row === undefined) return false
    await tx
      .update(copyRun)
      .set({
        endedAt: sql`statement_timestamp()`,
        outcome: outcome.kind,
        reason: reasonOf(outcome),
      })
      .where(eq(copyRun.id, claimed.holder.runId))
    const kept = tx
      .select({ id: copyRun.id })
      .from(copyRun)
      .where(eq(copyRun.copyId, copyId))
      .orderBy(desc(copyRun.startedAt))
      .limit(KEPT_RUNS)
    await tx.delete(copyRun).where(and(eq(copyRun.copyId, copyId), notInArray(copyRun.id, kept)))
    return true
  })
  if (!done) return lost(deps, claimed)
  const { pages, read, written } = counts
  const reason = reasonOf(outcome)
  deps.log.info(
    {
      ...{ companyId, copyId, runId: claimed.holder.runId, outcome: outcome.kind },
      ...(reason === null ? {} : { reason }),
      ...{ pages, read, written, ms: Math.round(performance.now() - counts.started) },
    },
    'COPY_RUN_ENDED',
  )
  return { kind: 'ENDED', outcome }
}

/** The sources in a run's order: those with a pass open first, then the others as they were made. */
function inRunOrder(sources: readonly StoredSource[]): StoredSource[] {
  return [
    ...sources.filter((source) => source.position !== null),
    ...sources.filter((source) => source.position === null),
  ]
}

/**
 * One run of one copy, the Factory's shape (`build.ts:139-216`): the lease, then the rows of an
 * account that is no source's out of the table (Desligar's net), then each source's pass. A source
 * the provider asked to wait ends the run when the provider counts its limit by the app, which every
 * account shares; by the account, the run goes on to the next source and ends `PARTIAL` `WAIT`. The
 * last source closed ends it `COMPLETE`; the ceilings hold for the whole run.
 */
export async function runCopy(
  deps: CopiesDeps,
  ids: Ids,
  signal: AbortSignal,
): Promise<CopyRunEnd> {
  const claimed = await claim(deps, ids)
  if (claimed.kind !== 'CLAIMED') return claimed
  const held: Claimed = claimed
  const counts = { pages: 0, read: 0, written: 0, started: performance.now() }
  function end(outcome: CopyOutcome) {
    return ended(deps, held, outcome, counts)
  }
  const { sync } = claimed
  if (sync === undefined) return end(DATABASE_DOWN)
  const table = copyTableOf(held.copy, held.sources)
  const run: Run = { deps, ids, signal, claimed: held, sync, table, counts, end }
  if (!(await netDropped(run))) return end(DATABASE_DOWN)
  const byApp = deps.connectors().countedBy(held.copy.connectorId) === 'APP'
  let waited = false
  for (const source of inRunOrder(held.sources)) {
    const step: SourceStep = source.waits ? { kind: 'WAIT' } : await sourcePass(run, source)
    if (step.kind === 'END') return step.end
    if (step.kind === 'WAIT') {
      if (byApp) return end(WAIT)
      waited = true
    }
  }
  return end(waited ? WAIT : { kind: 'COMPLETE' })
}
