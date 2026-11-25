import type {
  PageAsk,
  TableColumn,
  TableDeclaration,
  TableFilter,
  TablePageRead,
  TableReach,
  TableReadFailed,
} from '@conexus/connectors'
import { readTablePage, startDateLimits, tableCeiling, tableMonths } from '@conexus/connectors'
import type { Bookmark, Pass, SingerMessage } from './messages.ts'
import { lineOf, recordLine, schemaOf } from './messages.ts'

export type PassDeps = Readonly<{
  now: () => number
  sleep: (ms: number) => Promise<void>
  random: () => number
  write: (line: string) => Promise<void>
  log: (line: string) => void
}>

export type RunTable = Readonly<{
  table: TableDeclaration
  columns: readonly TableColumn[]
  stream: string
  whole: boolean
}>

/** The tries of one page, as singer-sdk's `RESTStream` (`backoff_max_tries`, 5). */
const TRIES = 5

/** The wait before try `n + 1`: `backoff.expo(factor=2)` with singer-sdk's `random_jitter`, or the provider's own wait. */
function waitMs(failed: TableReadFailed, tried: number, random: () => number): number {
  return failed.waitMs ?? Math.round((2 * 2 ** (tried - 1) + random()) * 1000)
}

/** A call the pass repeats without cutting rows: the sign-in, the discovery, the ceiling and the months, each up to `TRIES`, and each try leaves its line. `table` is empty when no table asks. */
export async function tried<T extends Readonly<{ kind: string }>>(
  read: () => Promise<T | TableReadFailed>,
  deps: PassDeps,
  table: string,
): Promise<T | TableReadFailed> {
  for (let count = 1; ; count++) {
    const started = deps.now()
    const done = await read()
    if (done.kind !== 'FAILED' || !('code' in done)) return done
    if (done.code !== 'COPY_SOURCE_UNREACHABLE') return done
    const last = count === TRIES
    const wait = last ? null : waitMs(done, count, deps.random)
    logTry(deps, {
      event: last ? 'QUERY_FAILED' : 'QUERY_RETRIED',
      table,
      filter: null,
      attempt: count,
      failed: done,
      nextRows: null,
      waitMs: wait,
      elapsedMs: deps.now() - started,
    })
    if (wait === null) return done
    await deps.sleep(wait)
  }
}

/**
 * One diagnostic line of a failed try: scalars only, never the body (security S41). `rows` is what
 * the page asked and `nextRows` what the next try asks, so a cut reads off the line.
 */
function logTry(
  deps: PassDeps,
  a: Readonly<{
    event: 'PAGE_REDUCED' | 'PAGE_RETRIED' | 'PAGE_FAILED' | 'QUERY_RETRIED' | 'QUERY_FAILED'
    table: string
    filter: TableFilter['kind'] | null
    attempt: number
    failed: TableReadFailed
    nextRows: number | null
    waitMs: number | null
    elapsedMs: number
  }>,
): void {
  const { failed } = a
  deps.log(
    JSON.stringify({
      event: a.event,
      table: a.table,
      filter: a.filter,
      rows: failed.rows,
      nextRows: a.nextRows,
      attempt: a.attempt,
      waitMs: a.waitMs,
      elapsedMs: a.elapsedMs,
      status: failed.system?.status ?? null,
      code: failed.code,
      systemCode: failed.system?.code ?? null,
      bodyBytes: failed.bodyBytes,
    }),
  )
}

/**
 * One page, asked until it reads or its tries end. A 5xx or an ended deadline asks half the rows at
 * the same point, since the identical ask only fails again (Airbyte `source-github`, `AGENTS.md`
 * 618-622), and the cut is the pass's ceiling to its end. At one row, when the failure is a 429 or a
 * dead network, or when a cut would not lower the ceiling because the reader ignored it, the ask
 * repeats after the wait `tried` takes, up to `TRIES`: a reader that ignores the ceiling fails the
 * table instead of hanging the pass.
 */
async function pageOf(
  ask: PageAsk,
  table: string,
  deps: PassDeps,
): Promise<Readonly<{ page: TablePageRead; ceiling: number | undefined }>> {
  let { ceiling } = ask
  for (let tries = 1; ; tries++) {
    const started = deps.now()
    const page = await readTablePage({ ...ask, ...(ceiling === undefined ? {} : { ceiling }) })
    if (page.kind !== 'FAILED' || page.code !== 'COPY_SOURCE_UNREACHABLE') return { page, ceiling }
    const half = page.smaller && page.rows !== null ? Math.floor(page.rows / 2) : 0
    const cut = half >= 1 && half < (ceiling ?? Infinity) ? half : null
    const last = cut === null && tries === TRIES
    const wait = last ? null : waitMs(page, cut === null ? tries : 1, deps.random)
    const event = last ? 'PAGE_FAILED' : cut === null ? 'PAGE_RETRIED' : 'PAGE_REDUCED'
    logTry(deps, {
      event,
      table,
      filter: ask.filter.kind,
      attempt: tries,
      failed: page,
      nextRows: last ? null : (cut ?? page.rows),
      waitMs: wait,
      elapsedMs: deps.now() - started,
    })
    if (wait === null) return { page, ceiling }
    await deps.sleep(wait)
    if (cut !== null) {
      ceiling = cut
      tries = 0
    }
  }
}

const SAO_PAULO_MONTH = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
})

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/

function indexOf(month: string): number | null {
  const [, year, at] = MONTH.exec(month) ?? []
  return year === undefined ? null : Number(year) * 12 + Number(at) - 1
}

function monthAt(index: number): string {
  return `${String(Math.floor(index / 12)).padStart(4, '0')}-${String((index % 12) + 1).padStart(2, '0')}`
}

function thisMonth(now: number): number {
  return indexOf(SAO_PAULO_MONTH.format(now)) ?? 0
}

/** From the saved month when it is earlier than `reread` months back: a copy stopped for months misses none. */
function monthsToReread(now: number, point: string, reread: number): readonly string[] {
  const last = thisMonth(now)
  const first = Math.min(indexOf(point) ?? last, last - reread + 1)
  return Array.from({ length: last - first + 1 }, (_, at) => monthAt(first + at))
}

/** ISO dates and instants order as text, so the latest is the last after a sort. */
function latest(values: readonly (string | null | undefined)[]): string | undefined {
  return values
    .filter((value) => value != null)
    .sort()
    .at(-1)
}

type Plan = Readonly<{ filters: readonly TableFilter[]; point: string | null } | TableReadFailed>

async function planOf(
  reach: TableReach,
  run: RunTable,
  a: Readonly<{ bookmark: Bookmark | undefined; startDate: string | null; deps: PassDeps }>,
): Promise<Plan> {
  const { mode } = run.table
  const point = run.whole ? undefined : a.bookmark?.replication_key_value
  const date = startDateLimits(mode) ? a.startDate : null
  if (mode.kind === 'FULL') return { filters: [{ kind: 'ALL' }], point: null }
  if (mode.kind === 'CHANGED') {
    const since = latest([point, date])
    const filters: TableFilter[] = [
      since === undefined ? { kind: 'ALL' } : { kind: 'SINCE', column: mode.column, after: since },
    ]
    if (run.table.source.kind === 'OPERATION') return { filters, point: null }
    const ceiling = await tried(
      () => tableCeiling({ ...reach, table: run.table, columns: run.columns }),
      a.deps,
      run.stream,
    )
    return ceiling.kind === 'CEILING' ? { filters, point: ceiling.value } : ceiling
  }
  const counted =
    point === undefined
      ? await tried(() => tableMonths({ ...reach, table: run.table }), a.deps, run.stream)
      : { kind: 'MONTHS' as const, months: monthsToReread(a.deps.now(), point, mode.reread) }
  if (counted.kind !== 'MONTHS') return counted
  const first = date?.slice(0, 7) ?? ''
  const months = counted.months.filter((month) => month >= first)
  return {
    filters: months.map((month) => ({ kind: 'MONTH', column: mode.column, month })),
    point: null,
  }
}

/** An operation's table has no ceiling to ask, so its pass saves the latest change it read. */
function readOf(run: RunTable, rows: readonly Readonly<Record<string, string | null>>[]) {
  const { mode, source } = run.table
  if (mode.kind !== 'CHANGED' || source.kind !== 'OPERATION') return null
  return latest(rows.map((row) => row[mode.column])) ?? null
}

function doneOf(run: RunTable, pass: Pass, before: Bookmark | undefined, now: number): Bookmark {
  const { mode } = run.table
  if (mode.kind === 'FULL') return {}
  if (mode.kind === 'WINDOW') return { replication_key_value: monthAt(thisMonth(now)) }
  const value = latest([pass.point, run.whole ? null : before?.replication_key_value])
  return value === undefined ? {} : { replication_key_value: value }
}

function advanced(
  pass: Pass,
  page: Extract<TablePageRead, { kind: 'PAGE' }>,
  read: string | null,
): Readonly<{ pass: Pass; done: boolean }> {
  const point = latest([pass.point, read]) ?? null
  if (page.next !== null) return { pass: { ...pass, after: page.next, point }, done: false }
  if (pass.at + 1 < pass.filters.length)
    return { pass: { ...pass, at: pass.at + 1, after: null, point }, done: false }
  return { pass: { ...pass, point }, done: true }
}

export async function readTable(
  reach: TableReach,
  run: RunTable,
  a: Readonly<{
    bookmarks: Record<string, Bookmark>
    startDate: string | null
    deps: PassDeps
  }>,
): Promise<TableReadFailed | null> {
  const { deps, bookmarks } = a
  const before = bookmarks[run.stream]
  function emit(message: SingerMessage) {
    return deps.write(lineOf(message))
  }
  const key = run.table.key.map((name) => name.toLowerCase())
  await emit({
    type: 'SCHEMA',
    stream: run.stream,
    schema: schemaOf(run.columns),
    key_properties: key,
  })
  let pass = run.whole ? undefined : before?.pass
  if (pass === undefined) {
    const plan = await planOf(reach, run, { bookmark: before, startDate: a.startDate, deps })
    if ('code' in plan) return plan
    pass = {
      version: deps.now(),
      filters: [...plan.filters],
      at: 0,
      after: null,
      point: plan.point,
    }
  }
  let done = pass.filters.length === 0
  while (!done) {
    const current: Pass = pass
    const filter = current.filters[current.at] ?? { kind: 'ALL' }
    const { page, ceiling } = await pageOf(
      {
        ...reach,
        table: run.table,
        columns: run.columns,
        filter,
        after: current.after,
        ...(current.ceiling === undefined ? {} : { ceiling: current.ceiling }),
      },
      run.stream,
      deps,
    )
    if (page.kind !== 'PAGE') return page
    for (const row of page.rows)
      await deps.write(
        recordLine({ stream: run.stream, columns: run.columns, row, version: current.version }),
      )
    const cut = ceiling === undefined ? current : { ...current, ceiling }
    ;({ pass, done } = advanced(cut, page, readOf(run, page.rows)))
    if (!done) {
      bookmarks[run.stream] = { ...before, pass }
      await emit({ type: 'STATE', value: { bookmarks } })
    }
  }
  await emit({ type: 'ACTIVATE_VERSION', stream: run.stream, version: pass.version })
  bookmarks[run.stream] = doneOf(run, pass, before, deps.now())
  await emit({ type: 'STATE', value: { bookmarks } })
  return null
}
