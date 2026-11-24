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
import { TABLE_PAGE_DEFAULT } from './tables.ts'

const SYSTEM_FAILED_AT = 500

function systemOf(native: Native | undefined): TableSourceFailure['system'] {
  return native === undefined
    ? null
    : { status: native.status, code: native.code, message: native.message }
}

function failed(
  code: TableSourceFailure['code'],
  native?: Native,
  waitMs: number | null = null,
): TableReadFailed {
  return { kind: 'FAILED', code, system: systemOf(native), waitMs }
}

type Stopped = Readonly<{ kind: string; native?: Native; waitMs?: number | null }>

/** A call that gave no value, as the kit's code: a 5xx, a 429 or the network is the source out of reach, which the adapter repeats. */
function stoppedBy(stop: Stopped): TableReadFailed {
  const { kind, native } = stop
  if (kind === 'AUTH_REFUSED' || kind === 'TOKEN_EXPIRED' || kind === 'NEEDS_REAUTH')
    return failed('COPY_SOURCE_NEEDS_REAUTH', native)
  if (kind === 'REFUSED') return failed('COPY_SOURCE_REFUSED', native)
  if (kind === 'BUSY') return failed('COPY_SOURCE_UNREACHABLE', native, stop.waitMs ?? null)
  if (kind === 'UNREACHABLE' || (native !== undefined && native.status >= SYSTEM_FAILED_AT))
    return failed('COPY_SOURCE_UNREACHABLE', native)
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
  if (done.kind === 'UNSENT' && 'sent' in done) return stoppedBy(done.sent)
  return stoppedBy(done)
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
  }>

/** The rows the page after this one asks: the same, or fewer when this one passed the page's bytes; never fewer than 1. */
export function rowsAfter(asked: number, rows: readonly unknown[], bytes: number): number {
  const size = Buffer.byteLength(JSON.stringify(rows))
  return size > bytes ? Math.max(1, Math.floor((asked * bytes) / size)) : asked
}

export function pageOf(connector: Connector): Readonly<{ rows: number; bytes: number }> {
  return connector.tables?.page ?? TABLE_PAGE_DEFAULT
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
