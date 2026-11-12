import { randomUUID } from 'node:crypto'
import type { CompanyId, CopyId } from '@conexus/hub-api'
import { CopyRunId } from '@conexus/hub-api'
import { and, desc, eq, isNull, lt, notInArray, or, sql } from 'drizzle-orm'
import type { CopyAccount, CopyTable } from '../../platform/copy-sql.ts'
import type { DatabaseUrl } from '../../platform/database.ts'
import type { CopyPosition } from '../connectors/public.ts'
import { connectionNamesOf } from '../connectors/public.ts'
import type { Holder, StoredSource } from './sources.ts'
import { datedPasses, passed, restarted, saved, sourcesOf, waiting } from './sources.ts'
import type { CopiesDeps, CopyOutcome, CopyRunEnd, CopyTuning, StoredCopy } from './store.ts'
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
const DAY_MS = 86_400_000

type Ids = { companyId: CompanyId; copyId: CopyId }
type Claimed = {
  copy: StoredCopy
  holder: Holder
  sync: DatabaseUrl | undefined
  sources: StoredSource[]
  /** The company's name of each source's connection, the account's name in the table. */
  names: ReadonlyMap<string, { name: string }>
}
type Counts = { pages: number; read: number; written: number }

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

/** A run that lost its lease to another: it writes nothing more, and the other ends this run's row. */
function lost(deps: CopiesDeps, claimed: Claimed): CopyRunEnd {
  const { companyId, id: copyId } = claimed.copy
  deps.log.error({ companyId, copyId, runId: claimed.holder.runId }, 'COPY_CLAIM_LOST')
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

function dayOf(instant: number): string {
  return new Date(instant).toISOString().slice(0, 10)
}

/**
 * The two dates of a source's pass, the same on each of its pages: the watermark less a day (a day in
 * version 1, an instant in version 2; none on its first pass, which reads all, #940), and version 1's
 * window from the pass's start.
 */
function datesOf(definition: StoredCopy['definition'], source: StoredSource) {
  const from = source.watermark === null ? null : source.watermark.getTime() - DAY_MS
  const since =
    from === null ? null : definition.version === 2 ? new Date(from).toISOString() : dayOf(from)
  const window = definition.version === 1 ? definition.window : undefined
  const began = source.passStartedAt?.getTime() ?? Date.now()
  const windowFrom = window === undefined ? null : dayOf(began - window.days * DAY_MS)
  return { since, windowFrom }
}

const DATABASE_DOWN = { kind: 'ERROR', code: 'COPY_DATABASE_UNAVAILABLE' } as const
const WAIT = { kind: 'PARTIAL', reason: 'WAIT' } as const

type Run = {
  deps: CopiesDeps
  ids: Ids
  signal: AbortSignal
  claimed: Claimed
  sync: DatabaseUrl
  table: CopyTable
  counts: Counts & { started: number }
  end: (outcome: CopyOutcome) => Promise<CopyRunEnd>
}

/** The Hub's stop, or a ceiling of the whole run, reached before the next page: the run's end; none when it goes on. */
async function halted(run: Run): Promise<CopyRunEnd | undefined> {
  const { deps, signal, counts } = run
  if (deps.updating() || signal.aborted) return run.end({ kind: 'PARTIAL', reason: 'STOPPED' })
  const capped =
    counts.pages >= deps.tuning.runPages || performance.now() - counts.started >= deps.tuning.runMs
  if (!capped) return undefined
  const result = await run.end({ kind: 'PARTIAL', reason: 'CAP' })
  if (result.kind === 'ENDED' && result.outcome.kind === 'PARTIAL')
    await deps.clock().runNow(run.ids.copyId)
  return result
}

/** How a source's turn in the run ended: the run's end, its pass closed, or the provider asking to wait. */
type SourceStep = { kind: 'END'; end: CopyRunEnd } | { kind: 'CLOSED' } | { kind: 'WAIT' }

function account(run: Run, source: StoredSource): CopyAccount {
  if (source.accountRef === null) return null
  return { ref: source.accountRef, name: run.claimed.names.get(source.connectionId)?.name ?? '' }
}

/** The source's pass closed once its last page is written: its account's rows the pass did not write go, and the pass is counted. */
async function closedPass(
  run: Run,
  source: StoredSource,
  windowFrom: string | null,
): Promise<SourceStep> {
  const { deps, claimed, sync, signal, table } = run
  const closed = await deps.companyPostgres.closePass(
    sync,
    { ...table, pass: source.pass, windowFrom, account: account(run, source) },
    signal,
  )
  if (closed.kind !== 'DONE') return { kind: 'END', end: await run.end(DATABASE_DOWN) }
  const done = await passed(deps, claimed.holder, {
    connectionId: source.connectionId,
    rows: closed.rows,
  })
  return done ? { kind: 'CLOSED' } : { kind: 'END', end: lost(deps, claimed) }
}

/** The run's end on a failed read: the Hub's stop when it stopped the read, the code otherwise. */
async function failed(run: Run, outcome: CopyOutcome): Promise<SourceStep> {
  const stopped = run.signal.aborted ? ({ kind: 'PARTIAL', reason: 'STOPPED' } as const) : outcome
  return { kind: 'END', end: await run.end(stopped) }
}

/**
 * One source's turn: page after page read, written in the company's database with its account and
 * saved on the source, until its pass ends, the provider asks to wait, a ceiling, the Hub's stop or
 * a failure. A failure keeps the position and never moves the watermark nor takes a row out.
 */
async function sourcePass(run: Run, source: StoredSource): Promise<SourceStep> {
  const { deps, ids, signal, claimed, sync, counts, table } = run
  const { connectionId } = source
  const { definition, createdBy } = claimed.copy
  const { since, windowFrom } = datesOf(definition, source)
  let position: CopyPosition | null = source.position
  for (;;) {
    const stopped = await halted(run)
    if (stopped !== undefined) return { kind: 'END', end: stopped }
    const read = await deps.connectors().readPage({
      ...{ companyId: ids.companyId, connectionId, enabledBy: createdBy, definition, position },
      ...{ since, windowFrom, limit: deps.tuning.pageRows, signal },
    })
    switch (read.kind) {
      case 'NO_CONNECTION':
        return failed(run, { kind: 'ERROR', code: 'COPY_SOURCE_UNREACHABLE' })
      case 'FAILED':
        return failed(run, { kind: 'ERROR', code: read.code })
      case 'WAIT': {
        if (signal.aborted) return failed(run, WAIT)
        const kept =
          read.waitMs === null ||
          (await waiting(deps, claimed.holder, { connectionId, waitMs: read.waitMs }))
        return kept ? { kind: 'WAIT' } : { kind: 'END', end: lost(deps, claimed) }
      }
      case 'STALE': {
        if (!(await restarted(deps, claimed.holder, { connectionId })))
          return { kind: 'END', end: lost(deps, claimed) }
        const { companyId, copyId } = ids
        const fields = { companyId, copyId, runId: claimed.holder.runId, connectionId }
        deps.log.info({ ...fields, pass: source.pass }, 'COPY_PASS_RESTARTED')
        position = null
        break
      }
      case 'PAGE': {
        const { rows, more } = read.page
        const written = await deps.companyPostgres.writePage(
          sync,
          { ...table, pass: source.pass, rows, account: account(run, source) },
          signal,
        )
        if (written.kind !== 'DONE') return { kind: 'END', end: await run.end(DATABASE_DOWN) }
        const page = { connectionId, position: read.next, rows: rows.length }
        if (!(await saved(deps, claimed.holder, page)))
          return { kind: 'END', end: lost(deps, claimed) }
        counts.pages += 1
        counts.read += rows.length
        counts.written += rows.length
        if (!more) return closedPass(run, source, windowFrom)
        position = read.next
        break
      }
      default:
        return read satisfies never
    }
  }
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
  if (table.accounts) {
    const refs = held.sources.flatMap((source) => source.accountRef ?? [])
    const net = await deps.companyPostgres.dropForeignRows(sync, { copy: table.name, refs }, signal)
    if (net.kind !== 'DONE') return end(DATABASE_DOWN)
  }
  const run: Run = { deps, ids, signal, claimed: held, sync, table, counts, end }
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
