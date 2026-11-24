import type {
  TableColumn,
  TableDeclaration,
  TableFilter,
  TablePageRead,
  TableReach,
  TableReadFailed,
} from '@conexus/connectors'
import { readTablePage, startDateLimits, tableMonths } from '@conexus/connectors'
import type { Bookmark, Pass, SingerMessage } from './messages.ts'
import { lineOf, recordLine, schemaOf } from './messages.ts'

export type PassDeps = Readonly<{
  now: () => number
  sleep: (ms: number) => Promise<void>
  random: () => number
  write: (line: string) => Promise<void>
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

export async function tried<T extends Readonly<{ kind: string }>>(
  read: () => Promise<T | TableReadFailed>,
  deps: PassDeps,
): Promise<T | TableReadFailed> {
  for (let count = 1; ; count++) {
    const done = await read()
    if (done.kind !== 'FAILED' || !('code' in done)) return done
    if (done.code !== 'COPY_SOURCE_UNREACHABLE' || count === TRIES) return done
    await deps.sleep(waitMs(done, count, deps.random))
  }
}

const SAO_PAULO_MONTH = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
})

function monthsUpTo(now: number, count: number): readonly string[] {
  const [year = 0, month = 1] = SAO_PAULO_MONTH.format(now).split('-').map(Number)
  return Array.from({ length: count }, (_, back) => {
    const at = year * 12 + (month - 1) - (count - 1 - back)
    return `${String(Math.floor(at / 12)).padStart(4, '0')}-${String((at % 12) + 1).padStart(2, '0')}`
  })
}

/** ISO dates and instants order as text, so the latest is the last after a sort. */
function latest(values: readonly (string | null | undefined)[]): string | undefined {
  return values
    .filter((value) => value != null)
    .sort()
    .at(-1)
}

type Plan = Readonly<{ filters: readonly TableFilter[] } | TableReadFailed>

async function planOf(
  reach: TableReach,
  run: RunTable,
  a: Readonly<{ bookmark: Bookmark | undefined; startDate: string | null; deps: PassDeps }>,
): Promise<Plan> {
  const { mode } = run.table
  const point = run.whole ? undefined : a.bookmark?.replication_key_value
  const date = startDateLimits(mode) ? a.startDate : null
  if (mode.kind === 'FULL') return { filters: [{ kind: 'ALL' }] }
  if (mode.kind === 'CHANGED') {
    const since = latest([point, date])
    return {
      filters: [
        since === undefined
          ? { kind: 'ALL' }
          : { kind: 'SINCE', column: mode.column, after: since },
      ],
    }
  }
  const counted =
    point === undefined
      ? await tried(() => tableMonths({ ...reach, table: run.table }), a.deps)
      : { kind: 'MONTHS' as const, months: monthsUpTo(a.deps.now(), mode.reread) }
  if (counted.kind !== 'MONTHS') return counted
  const first = date?.slice(0, 7) ?? ''
  const months = counted.months.filter((month) => month >= first)
  return { filters: months.map((month) => ({ kind: 'MONTH', column: mode.column, month })) }
}

function changedOf(
  run: RunTable,
  rows: readonly Readonly<Record<string, string | null>>[],
): string | null {
  const { mode } = run.table
  if (mode.kind !== 'CHANGED') return null
  return latest(rows.map((row) => row[mode.column])) ?? null
}

function doneOf(run: RunTable, pass: Pass, before: Bookmark | undefined, now: number): Bookmark {
  const { mode } = run.table
  if (mode.kind === 'FULL') return {}
  if (mode.kind === 'WINDOW') return { replication_key_value: monthsUpTo(now, 1)[0] }
  const value = latest([pass.max, run.whole ? null : before?.replication_key_value])
  return value === undefined ? {} : { replication_key_value: value }
}

function advanced(
  pass: Pass,
  page: Extract<TablePageRead, { kind: 'PAGE' }>,
  max: string | null,
): Readonly<{ pass: Pass; done: boolean }> {
  const best = latest([pass.max, max]) ?? null
  if (page.next !== null) return { pass: { ...pass, after: page.next, max: best }, done: false }
  if (pass.at + 1 < pass.filters.length)
    return { pass: { ...pass, at: pass.at + 1, after: null, max: best }, done: false }
  return { pass: { ...pass, max: best }, done: true }
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
    pass = { version: deps.now(), filters: [...plan.filters], at: 0, after: null, max: null }
  }
  let done = pass.filters.length === 0
  while (!done) {
    const current: Pass = pass
    const filter = current.filters[current.at] ?? { kind: 'ALL' }
    const page = await tried(
      () =>
        readTablePage({
          ...reach,
          table: run.table,
          columns: run.columns,
          filter,
          after: current.after,
        }),
      deps,
    )
    if (page.kind !== 'PAGE') return page
    for (const row of page.rows)
      await deps.write(
        recordLine({ stream: run.stream, columns: run.columns, row, version: current.version }),
      )
    ;({ pass, done } = advanced(current, page, changedOf(run, page.rows)))
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
