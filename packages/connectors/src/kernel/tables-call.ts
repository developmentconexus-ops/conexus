import type { Connector } from './definition.ts'
import type { Account, Answered, Native, Operation, ProviderRequest } from './operation.ts'
import { requestOf } from './operation.ts'
import type { ProviderSend, Session } from './session.ts'
import type {
  TableColumn,
  TableDeclaration,
  TableFilter,
  TablePosition,
  TableReadFailed,
  TableSendFailure,
  TableSourceFailure,
} from './tables.ts'

const SYSTEM_FAILED_AT = 500

function systemOf(native: Native | undefined): TableSourceFailure['system'] {
  return native === undefined
    ? null
    : { status: native.status, code: native.code, message: native.message }
}

function bodyBytesOf(native: Native | undefined): number | null {
  const body = native?.body
  if (body === undefined || body === null) return null
  return Buffer.byteLength(typeof body === 'string' ? body : JSON.stringify(body))
}

function failed(
  code: TableSourceFailure['code'],
  native?: Native,
  a: Readonly<{ waitMs?: number | null; smaller?: boolean }> = {},
): TableReadFailed {
  return {
    kind: 'FAILED',
    code,
    system: systemOf(native),
    waitMs: a.waitMs ?? null,
    smaller: a.smaller ?? false,
    rows: null,
    bodyBytes: bodyBytesOf(native),
  }
}

export type TableStop = Readonly<{ kind: string; native?: Native; waitMs?: number | null }>

/** A call that gave no value, as the kit's code: a 5xx, a 429, the network or a deadline is the source out of reach, which the adapter repeats; a 5xx and a deadline are also `smaller`, since fewer rows can clear them. */
export function tableFailureOf(stop: TableStop): TableReadFailed {
  const { kind, native } = stop
  if (kind === 'AUTH_REFUSED' || kind === 'TOKEN_EXPIRED' || kind === 'NEEDS_REAUTH')
    return failed('COPY_SOURCE_NEEDS_REAUTH', native)
  if (kind === 'REFUSED') return failed('COPY_SOURCE_REFUSED', native)
  if (kind === 'BUSY') return failed('COPY_SOURCE_UNREACHABLE', native, { waitMs: stop.waitMs })
  if (kind === 'TIMED_OUT') return failed('COPY_SOURCE_UNREACHABLE', native, { smaller: true })
  if (native !== undefined && native.status >= SYSTEM_FAILED_AT)
    return failed('COPY_SOURCE_UNREACHABLE', native, { smaller: true })
  if (kind === 'UNREACHABLE') return failed('COPY_SOURCE_UNREACHABLE', native)
  return failed('COPY_SOURCE_UNREADABLE', native)
}

/** One call of a table operation through the session: the value it read, or why it stopped. */
export async function called<I, O>(
  reach: TableReach,
  operation: Operation<I, O>,
  input: I,
): Promise<Readonly<{ kind: 'READ'; value: O }> | TableReadFailed> {
  const request: ProviderRequest = requestOf(operation, input, reach.account, new Date())
  const done = await reach.session.call(
    async (token): Promise<Answered<O> | Readonly<{ kind: 'UNSENT'; sent: TableSendFailure }>> => {
      const sent = await reach.send(request, { token, signal: reach.signal })
      return 'status' in sent ? operation.answer(sent) : { kind: 'UNSENT', sent }
    },
    reach.signal,
  )
  if (done.kind === 'OK' && 'value' in done) return { kind: 'READ', value: done.value }
  if (done.kind === 'UNSENT' && 'sent' in done) return tableFailureOf(done.sent)
  return tableFailureOf(done)
}

export type TablePageRead =
  | Readonly<{
      kind: 'PAGE'
      rows: readonly Readonly<Record<string, string | null>>[]
      next: TablePosition | null
    }>
  | TableReadFailed

export type PageAsk = TableReach &
  Readonly<{
    table: TableDeclaration
    columns: readonly TableColumn[]
    filter: TableFilter
    after: TablePosition | null
    // the most rows any page of this pass asks, set when a 5xx or a deadline cut the page
    ceiling?: number
  }>

/** The rows a TABLE source's first page of a filter asks: no row's width is known before one is read. */
export const FIRST_PAGE_ROWS = 10

/** How many times the rows asked the next page may grow: a few narrow rows do not stand for the table. */
const GROWTH = 10

/**
 * The rows the page after this one asks: as many as fit `bytes` at the width just read, at most
 * `GROWTH` times the rows asked and `max`, never fewer than 1. The page's bytes bind every request
 * from the second on, so a table of wide rows never asks the source for more than its bytes.
 */
export function rowsAfter(
  asked: number,
  rows: readonly unknown[],
  bytes: number,
  max: number,
): number {
  if (rows.length === 0) return asked
  const fit = Math.floor((rows.length * bytes) / Buffer.byteLength(JSON.stringify(rows)))
  return Math.max(1, Math.min(fit, asked * GROWTH, max))
}

export const UNREADABLE: TableReadFailed = failed('COPY_SOURCE_UNREADABLE')

/** How the kit's table reads reach the provider: a session's token, and a sender of the kit's request to the connector's origin. */
export type TableReach = Readonly<{
  connector: Connector
  session: Session<Readonly<{ kind: string }>>
  send: ProviderSend<TableSendFailure>
  account: Account
  signal: AbortSignal
}>
