import { randomUUID } from 'node:crypto'
import type { CompanyId, CopyId } from '@conexus/hub-api'
import { CopyRunId } from '@conexus/hub-api'
import { and, desc, eq, isNull, lt, notInArray, or, sql } from 'drizzle-orm'
import type { DatabaseUrl } from '../../platform/database.ts'
import type { CopiesDeps, CopyOutcome, CopyRunEnd, CopyTuning, StoredCopy } from './store.ts'
import { companyScope, parsedCopy, syncOf } from './store.ts'
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
const DAY_MS = 86_400_000
/** Before any change date a source keeps: the first pass reads it all. */
const FIRST_SINCE = '1900-01-01'

type Ids = { companyId: CompanyId; copyId: CopyId }
type Claimed = { copy: StoredCopy; token: string; runId: CopyRunId; sync: DatabaseUrl | undefined }
type Counts = { pages: number; read: number; written: number }

function leaseFrom(deps: CopiesDeps) {
  return sql`statement_timestamp() + ${deps.tuning.leaseMs} * interval '1 millisecond'`
}

/**
 * The lease taken in one Hub transaction (data D25): only when none is held or it ran out, decided
 * by the `UPDATE` itself (code C65). The open run a lost holder left ends `INTERRUPTED`, and the new
 * one begins; the pass keeps the instant it began.
 */
async function claim(deps: CopiesDeps, ids: Ids) {
  const token = randomUUID()
  const same = and(eq(copy.id, ids.copyId), eq(copy.companyId, ids.companyId))
  return deps.database.command(companyScope(ids.companyId), async (tx) => {
    const [row] = await tx
      .update(copy)
      .set({
        claimToken: token,
        claimedUntil: leaseFrom(deps),
        passStartedAt: sql`coalesce(${copy.passStartedAt}, statement_timestamp())`,
      })
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
    const claimed: Claimed = {
      copy: parsedCopy(row),
      token,
      runId,
      sync: await syncOf(deps, tx, ids.companyId),
    }
    return { kind: 'CLAIMED', ...claimed } as const
  })
}

function held(claimed: Claimed) {
  return and(eq(copy.id, claimed.copy.id), eq(copy.claimToken, claimed.token))
}

/** The page saved in the Hub while the lease is ours: the last key written, the lease renewed, the run's counts. */
async function saved(
  deps: CopiesDeps,
  claimed: Claimed,
  input: { position: readonly number[] | null; rows: number },
): Promise<boolean> {
  return deps.database.command(companyScope(claimed.copy.companyId), async (tx) => {
    const [row] = await tx
      .update(copy)
      .set({ position: input.position, claimedUntil: leaseFrom(deps) })
      .where(held(claimed))
      .returning({ id: copy.id })
    if (row === undefined) return false
    await tx
      .update(copyRun)
      .set({
        pages: sql`${copyRun.pages} + 1`,
        read: sql`${copyRun.read} + ${input.rows}`,
        written: sql`${copyRun.written} + ${input.rows}`,
      })
      .where(eq(copyRun.id, claimed.runId))
    return true
  })
}

/** The pass done in the Hub: the watermark moves to when it began, the next pass starts from nothing. */
async function passed(deps: CopiesDeps, claimed: Claimed, rows: number): Promise<boolean> {
  return deps.database.command(companyScope(claimed.copy.companyId), async (tx) => {
    const [row] = await tx
      .update(copy)
      .set({
        watermark: sql`${copy.passStartedAt}`,
        pass: sql`${copy.pass} + 1`,
        passStartedAt: null,
        position: null,
        rows,
      })
      .where(held(claimed))
      .returning({ id: copy.id })
    return row !== undefined
  })
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

/** A run that lost its lease to another: it writes nothing more, and the other ends this run's row. */
function lost(deps: CopiesDeps, claimed: Claimed): CopyRunEnd {
  const { companyId, id: copyId } = claimed.copy
  deps.log.error({ companyId, copyId, runId: claimed.runId }, 'COPY_CLAIM_LOST')
  return { kind: 'ENDED', outcome: { kind: 'INTERRUPTED' } }
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
      .set({ claimToken: null, claimedUntil: null, lastRunId: claimed.runId })
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
      .where(eq(copyRun.id, claimed.runId))
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
      ...{ companyId, copyId, runId: claimed.runId, outcome: outcome.kind },
      ...(reason === null ? {} : { reason }),
      ...{ pages, read, written, ms: Math.round(performance.now() - counts.started) },
    },
    'COPY_RUN_ENDED',
  )
  return { kind: 'ENDED', outcome }
}

function dayOf(instant: number): string {
  return new Date(instant).toISOString().slice(0, 10)
}

/** The two dates of the pass, the same on each of its pages: the watermark less a day, the window from the pass's start. */
function datesOf(stored: StoredCopy) {
  const since = stored.watermark === null ? FIRST_SINCE : dayOf(stored.watermark.getTime() - DAY_MS)
  const { window } = stored.definition
  const began = stored.passStartedAt?.getTime() ?? Date.now()
  const windowFrom = window === undefined ? null : dayOf(began - window.days * DAY_MS)
  return { since, windowFrom }
}

/** The key of the page's last row, the next page's start; the same when the page had no row. */
function lastKey(stored: StoredCopy, rows: readonly (readonly (string | null)[])[]) {
  const last = rows.at(-1)
  if (last === undefined) return stored.position
  const { columns, key } = stored.definition
  return key.map((name) => Number(last[columns.findIndex((column) => column.name === name)]))
}

/**
 * One run of one copy, the Factory's shape (`build.ts:139-216`): the lease, then page after page
 * read from the source, written in the company's database and saved in the Hub, until the pass
 * ends, a ceiling, the Hub's stop or a failure. A failure keeps the position and never moves the
 * watermark nor takes a row out.
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
  const databaseDown = { kind: 'ERROR', code: 'COPY_DATABASE_UNAVAILABLE' } as const
  const { sync } = claimed
  if (sync === undefined) return end(databaseDown)
  const stored = claimed.copy
  const { definition, name, pass } = stored
  const { since, windowFrom } = datesOf(stored)
  let position = stored.position
  for (;;) {
    if (deps.updating() || signal.aborted) return end({ kind: 'PARTIAL', reason: 'STOPPED' })
    if (
      counts.pages >= deps.tuning.runPages ||
      performance.now() - counts.started >= deps.tuning.runMs
    ) {
      const capped = await end({ kind: 'PARTIAL', reason: 'CAP' })
      if (capped.kind === 'ENDED' && capped.outcome.kind === 'PARTIAL')
        await deps.clock().runNow(ids.copyId)
      return capped
    }
    const read = await deps.connectors().readPage({
      companyId: ids.companyId,
      connectionId: stored.connectionId,
      enabledBy: stored.createdBy,
      input: { definition, after: position, since, windowFrom, limit: deps.tuning.pageRows },
      signal,
    })
    if (read.kind === 'NO_CONNECTION')
      return end({ kind: 'ERROR', code: 'COPY_SOURCE_UNREACHABLE' })
    if (read.kind === 'FAILED')
      return end(
        signal.aborted
          ? { kind: 'PARTIAL', reason: 'STOPPED' }
          : { kind: 'ERROR', code: read.code },
      )
    const { rows, more } = read.page
    const table = { name, definition }
    const written = await deps.companyPostgres.writePage(sync, { ...table, pass, rows }, signal)
    if (written.kind !== 'DONE') return end(databaseDown)
    position = lastKey(stored, rows) ?? position
    if (!(await saved(deps, claimed, { position, rows: rows.length }))) return lost(deps, claimed)
    counts.pages += 1
    counts.read += rows.length
    counts.written += rows.length
    if (more) continue
    const closed = await deps.companyPostgres.closePass(
      sync,
      { ...table, pass, windowFrom },
      signal,
    )
    if (closed.kind !== 'DONE') return end(databaseDown)
    if (!(await passed(deps, claimed, closed.rows))) return lost(deps, claimed)
    return end({ kind: 'COMPLETE' })
  }
}
