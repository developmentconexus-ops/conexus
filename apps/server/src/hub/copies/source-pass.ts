import type { CompanyId, CopyId } from '@conexus/hub-api'
import type { CopyAccount, CopyTable } from '../../platform/copy-sql.ts'
import type { DatabaseUrl } from '../../platform/database.ts'
import type { CopyPosition } from '../connectors/public.ts'
import type { Holder, StoredSource } from './sources.ts'
import { passed, restarted, saved, waiting } from './sources.ts'
import type { CopiesDeps, CopyOutcome, CopyRunEnd, StoredCopy } from './store.ts'

const DAY_MS = 86_400_000

export type Ids = { companyId: CompanyId; copyId: CopyId }
export type Claimed = {
  copy: StoredCopy
  holder: Holder
  sync: DatabaseUrl | undefined
  sources: StoredSource[]
  /** The company's name of each source's connection, the account's name in the table. */
  names: ReadonlyMap<string, { name: string }>
}
export type Counts = { pages: number; read: number; written: number }

/** A run that lost its lease to another: it writes nothing more, and the other ends this run's row. */
export function lost(deps: CopiesDeps, claimed: Claimed): CopyRunEnd {
  const { companyId, id: copyId } = claimed.copy
  deps.log.error({ companyId, copyId, runId: claimed.holder.runId }, 'COPY_CLAIM_LOST')
  return { kind: 'ENDED', outcome: { kind: 'INTERRUPTED' } }
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

export const DATABASE_DOWN = { kind: 'ERROR', code: 'COPY_DATABASE_UNAVAILABLE' } as const
export const WAIT = { kind: 'PARTIAL', reason: 'WAIT' } as const

export type Run = {
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
export type SourceStep = { kind: 'END'; end: CopyRunEnd } | { kind: 'CLOSED' } | { kind: 'WAIT' }

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

type CopyRead = Awaited<ReturnType<ReturnType<CopiesDeps['connectors']>['readPage']>>
/** A page's step: the source's turn ended, or the next page to read from `position`. */
type PageStep = SourceStep | { kind: 'NEXT'; position: CopyPosition | null }

/** The provider asked to wait: the source keeps when it may call again, the Hub's stop wins. */
async function waitStep(
  run: Run,
  source: StoredSource,
  waitMs: number | null,
): Promise<SourceStep> {
  const { deps, claimed, signal } = run
  if (signal.aborted) return failed(run, WAIT)
  const { connectionId } = source
  const kept = waitMs === null || (await waiting(deps, claimed.holder, { connectionId, waitMs }))
  return kept ? { kind: 'WAIT' } : { kind: 'END', end: lost(deps, claimed) }
}

/** The cursor outlived its validity: the source's pass starts again from nothing, logged. */
async function restartStep(run: Run, source: StoredSource): Promise<PageStep> {
  const { deps, ids, claimed } = run
  const { connectionId } = source
  if (!(await restarted(deps, claimed.holder, { connectionId })))
    return { kind: 'END', end: lost(deps, claimed) }
  const fields = { ...ids, runId: claimed.holder.runId, connectionId, pass: source.pass }
  deps.log.info(fields, 'COPY_PASS_RESTARTED')
  return { kind: 'NEXT', position: null }
}

/** A page written with the source's account and saved on the source; the last one closes the pass. */
async function pageStep(
  run: Run,
  source: StoredSource,
  read: Extract<CopyRead, { kind: 'PAGE' }>,
  windowFrom: string | null,
): Promise<PageStep> {
  const { deps, claimed, sync, signal, counts, table } = run
  const { rows, more } = read.page
  const written = await deps.companyPostgres.writePage(
    sync,
    { ...table, pass: source.pass, rows, account: account(run, source) },
    signal,
  )
  if (written.kind !== 'DONE') return { kind: 'END', end: await run.end(DATABASE_DOWN) }
  const page = { connectionId: source.connectionId, position: read.next, rows: rows.length }
  if (!(await saved(deps, claimed.holder, page))) return { kind: 'END', end: lost(deps, claimed) }
  counts.pages += 1
  counts.read += rows.length
  counts.written += rows.length
  if (!more) return closedPass(run, source, windowFrom)
  return { kind: 'NEXT', position: read.next }
}

/** What one read leads to. */
function stepOf(
  run: Run,
  source: StoredSource,
  read: CopyRead,
  windowFrom: string | null,
): Promise<PageStep> {
  switch (read.kind) {
    case 'NO_CONNECTION':
      return failed(run, { kind: 'ERROR', code: 'COPY_SOURCE_UNREACHABLE' })
    case 'FAILED':
      return failed(run, { kind: 'ERROR', code: read.code })
    case 'WAIT':
      return waitStep(run, source, read.waitMs)
    case 'STALE':
      return restartStep(run, source)
    case 'PAGE':
      return pageStep(run, source, read, windowFrom)
    default:
      return read satisfies never
  }
}

/**
 * One source's turn: page after page read, written in the company's database with its account and
 * saved on the source, until its pass ends, the provider asks to wait, a ceiling, the Hub's stop or
 * a failure. A failure keeps the position and never moves the watermark nor takes a row out.
 */
export async function sourcePass(run: Run, source: StoredSource): Promise<SourceStep> {
  const { deps, ids, signal, claimed } = run
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
    const step = await stepOf(run, source, read, windowFrom)
    if (step.kind !== 'NEXT') return step
    position = step.position
  }
}

/** Desligar's net before any pass: the rows of an account that is no source's leave a copy of accounts. */
export async function netDropped(run: Run): Promise<boolean> {
  const { deps, claimed, sync, table, signal } = run
  if (!table.accounts) return true
  const refs = claimed.sources.flatMap((source) => source.accountRef ?? [])
  const net = await deps.companyPostgres.dropForeignRows(sync, { copy: table.name, refs }, signal)
  return net.kind === 'DONE'
}
