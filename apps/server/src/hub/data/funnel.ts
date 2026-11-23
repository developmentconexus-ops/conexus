import type { DataSources } from '@conexus/hub-api'
import type { Principal } from '../access/public.ts'
import type { DataDeps, TurnBinding } from './deps.ts'

type Funnel = DataSources['funnel']
type FunnelAnswer = Awaited<ReturnType<Funnel>>

/** One write through the funnel of the Assistant's door, as the bound turn's speaker, who approved it, and the conversation's call. */
export async function funnelOf(
  deps: Pick<DataDeps, 'connectors'>,
  principal: Principal,
  turn: TurnBinding,
  a: Parameters<Funnel>[0],
): Promise<FunnelAnswer> {
  const written = await deps.connectors().assistant.write({
    ...{ scope: principal, connectionId: a.connection, operation: a.operation, input: a.input },
    ...{ threadId: a.call.thread, toolCallId: a.call.toolCall, signal: a.signal },
    ...turn,
  })
  switch (written.kind) {
    case 'OK':
    case 'WRITE_UNCERTAIN':
    case 'IDEMPOTENCY_CONFLICT':
      return written
    case 'WRITE_OPEN':
      return { kind: 'WRITE_OPEN', mark: written.mark, since: written.since.toISOString() }
    case 'REFUSED':
    case 'AUTH_REFUSED':
    case 'TOKEN_EXPIRED':
    case 'UNREADABLE':
      return { kind: written.kind, native: written.native }
    case 'BUSY':
      return { kind: 'BUSY', waitMs: written.waitMs }
    case 'NOT_IN_ROLE':
    case 'NOT_GRANTED':
    case 'UNREACHABLE':
    case 'DEADLINE':
    case 'CALLS_SPENT':
      return { kind: written.kind }
    default:
      return written satisfies never
  }
}
