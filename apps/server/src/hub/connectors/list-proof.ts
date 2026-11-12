import type { CopyDefinitionV2, ListRead, Rows } from '@conexus/connectors'
import { listPageOf } from '@conexus/connectors'
import type { ConnectionId, OfProject, PersonId, ProveCounts } from '@conexus/hub-api'
import { PROOF_PAGE_ROWS } from '@conexus/hub-api'
import type { CopyRefusal, ListAnswer } from './copy-port.ts'
import { listAnswer } from './copy-port.ts'
import type { OpenedConnection } from './executor.ts'
import { listReadOf } from './list-read.ts'
import type { Deps } from './rows.ts'

const DAY_MS = 86_400_000

/** The proof of one connection of a version 2 proposal, counted: never a cell. */
export type ListProved = Readonly<{
  kind: 'PROVED'
  rows: number
  more: boolean
  counts: ProveCounts
}>
/** A cell of `column` did not fit its type in `count` rows of a page of proof. */
export type ListMisfit = Readonly<{ kind: 'MISFIT'; column: string; count: number }>

type Refused = CopyRefusal | Readonly<{ kind: 'NOT_GRANTED' }> | Readonly<{ kind: 'CALLS_SPENT' }>

/** The rows whose cell of `column` does not fit its type, each row read alone by the kit's own reading. */
function misfitsOf(definition: CopyDefinitionV2, list: ListRead, rows: Rows, column: string) {
  const only = definition.columns.filter((each) => each.name === column)
  return rows.linhas.filter((row) => {
    const alone = { linhas: [row], temMais: false }
    const read = listPageOf({
      list,
      definition: { ...definition, columns: only },
      position: null,
      rows: alone,
      at: new Date(0),
    })
    return read.kind === 'MISFIT'
  }).length
}

type Counted =
  | Readonly<{ kind: 'COUNTED'; counts: Omit<ProveCounts, 'changedLastDay'> }>
  | ListMisfit
  | Readonly<{ kind: 'UNREADABLE'; reason: string }>

/** A page of proof as counts: its rows and whether more follow, the key's nulls and repeats, each column's nulls. */
function countedOf(definition: CopyDefinitionV2, read: Extract<ListAnswer, { kind: 'ROWS' }>) {
  const { list, rows, at } = read
  const page = listPageOf({ list, definition, position: null, rows, at })
  if (page.kind === 'MISFIT') {
    const count = misfitsOf(definition, list, rows, page.column)
    return { kind: 'MISFIT', column: page.column, count } satisfies Counted
  }
  if (page.kind !== 'PAGE') {
    const reason = page.kind === 'CEILING' ? 'CEILING' : page.reason
    return { kind: 'UNREADABLE', reason } satisfies Counted
  }
  const names = definition.columns.map((column) => column.name)
  const keyAt = definition.key.map((name) => names.indexOf(name))
  const seen = new Set<string>()
  let keyNull = 0
  let keyRepeated = 0
  for (const cells of page.rows) {
    const key = keyAt.map((index) => cells[index] ?? null)
    if (key.some((cell) => cell === null)) keyNull += 1
    else if (seen.has(JSON.stringify(key))) keyRepeated += 1
    else seen.add(JSON.stringify(key))
  }
  const nulls = Object.fromEntries(
    definition.columns.map(({ name }, index) => [
      name,
      page.rows.filter((cells) => cells[index] === null).length,
    ]),
  )
  const misfits = Object.fromEntries(definition.columns.map(({ name }) => [name, 0]))
  const { paging } = list
  const total = page.total
  const callsPerPass =
    paging.kind === 'NONE' ? 1 : total === null ? null : Math.max(1, Math.ceil(total / paging.max))
  const shown = Math.min(page.rows.length, PROOF_PAGE_ROWS)
  const more = page.more || page.rows.length > PROOF_PAGE_ROWS
  const counts = { rows: shown, more, keyNull, keyRepeated, nulls, misfits, total, callsPerPass }
  return { kind: 'COUNTED', counts } satisfies Counted
}

/** A page that brought no rows to count, as the model reads it: the source's refusal whole, a wait as a deadline, never a cell. */
function refusalOf(read: Exclude<ListAnswer, { kind: 'ROWS' }>): Refused {
  switch (read.kind) {
    case 'REFUSED':
      return read.refusal
    case 'IN_LINE':
      return { kind: 'DEADLINE' }
    case 'NOT_ROWS':
      return { kind: 'UNREADABLE', native: { status: 200, code: null, message: null, body: null } }
    case 'STALE':
    case 'NO_CONNECTION':
      return { kind: 'NOT_GRANTED' }
    default:
      return read satisfies never
  }
}

function unreadable(reason: string): Refused {
  return { kind: 'UNREADABLE', native: { status: 200, code: reason, message: null, body: null } }
}

/**
 * The proof of one connection of a version 2 proposal (O Sync de qualquer conector, U4): the first
 * page of the list read with no change filter, at most 50 rows, then, with `changedSince`, a page of
 * the rows changed in the last day; each call one of the run's 50. Two pages and 100 rows at most,
 * as the study's ceilings. Only counts leave: never a row, to the model or to a table.
 */
export async function provedList(
  deps: Deps,
  a: Readonly<{
    ids: OfProject
    opened: OpenedConnection | undefined
    connectionId: ConnectionId
    personId: PersonId
    definition: CopyDefinitionV2
    signal: AbortSignal
    spend: () => boolean
  }>,
): Promise<ListProved | ListMisfit | Refused> {
  const { ids, opened, connectionId, definition } = a
  if (opened === undefined || listReadOf(opened.connector, definition) === undefined) {
    const reason = opened === undefined ? 'NOT_GRANTED_TO_PROJECT' : 'NO_LIST_READ'
    deps.log.info({ ...ids, connectionId, reason }, 'BUILDER_READ_REFUSED')
    return { kind: 'NOT_GRANTED' }
  }
  const input = { companyId: ids.companyId, connectionId, enabledBy: a.personId, signal: a.signal }
  const asked = { input, definition, position: null, rows: PROOF_PAGE_ROWS, forModel: true }
  if (!a.spend()) return { kind: 'CALLS_SPENT' }
  const first = await listAnswer(deps, { ...asked, since: null })
  if (first.kind !== 'ROWS') return refusalOf(first)
  const counted = countedOf(definition, first)
  if (counted.kind === 'MISFIT') return counted
  if (counted.kind === 'UNREADABLE') return unreadable(counted.reason)
  const { counts } = counted
  if (definition.changedSince === null || first.list.changed === null)
    return {
      kind: 'PROVED',
      rows: counts.rows,
      more: counts.more,
      counts: { ...counts, changedLastDay: null },
    }
  if (!a.spend()) return { kind: 'CALLS_SPENT' }
  const since = new Date(deps.now().getTime() - DAY_MS).toISOString()
  const changed = await listAnswer(deps, { ...asked, since })
  if (changed.kind !== 'ROWS') return refusalOf(changed)
  const day = countedOf(definition, changed)
  if (day.kind === 'MISFIT') return day
  if (day.kind === 'UNREADABLE') return unreadable(day.reason)
  const changedLastDay = day.counts.total ?? day.counts.rows
  return {
    kind: 'PROVED',
    rows: counts.rows,
    more: counts.more,
    counts: { ...counts, changedLastDay },
  }
}
