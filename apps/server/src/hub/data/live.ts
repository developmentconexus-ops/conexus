import type { ConversationId, DataSources } from '@conexus/hub-api'
import type { Principal } from '../access/public.ts'
import type { DataDeps, TurnBinding } from './deps.ts'

type Live = DataSources['live']
type LiveAnswer = Awaited<ReturnType<Live>>

/** One read of a system now, through the Assistant's door with the bound turn: the same call count and the same row as its tool. */
export async function liveOf(
  deps: Pick<DataDeps, 'connectors'>,
  principal: Principal,
  bound: Readonly<{ turn: TurnBinding; thread: ConversationId | null }>,
  a: Parameters<Live>[0],
): Promise<LiveAnswer> {
  const answered = await deps.connectors().assistant.read(principal, {
    ...{ connectionId: a.connection, operation: a.operation, input: a.input },
    ...{ turn: bound.turn.turn, signal: a.signal },
    ...(bound.thread === null ? {} : { thread: bound.thread }),
  })
  switch (answered.kind) {
    case 'OK':
      return answered.empty === true
        ? { kind: 'OK', value: answered.whole, empty: true }
        : { kind: 'OK', value: answered.whole }
    case 'REFUSED':
    case 'AUTH_REFUSED':
    case 'UNREADABLE':
      return { kind: answered.kind, native: answered.native }
    case 'BUSY':
      return { kind: 'BUSY', waitMs: answered.waitMs }
    case 'UNREACHABLE':
    case 'DEADLINE':
    case 'NOT_GRANTED':
    case 'NOT_IN_ROLE':
    case 'CALLS_SPENT':
      return { kind: answered.kind }
    default:
      return answered satisfies never
  }
}
