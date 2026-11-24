import type { Native } from '@conexus/connectors'
import { deniesAccess } from '@conexus/connectors'
import type { Executor, OpenedConnection } from './executor.ts'
import { bearerOf } from './executor.ts'
import type { ConnectionSession } from './tokens.ts'

type Said<R extends string> = Readonly<{ result: R; native: Native }>

/**
 * What Testar's one check came to: n8n's accepted, rejected and unverified, with the provider's
 * answer kept. READ_REFUSED: the key was taken, the check read was not (`read` names it).
 */
export type Checked =
  | Readonly<{ result: 'WORKING' }>
  | Said<'AUTH_REFUSED'>
  | Readonly<{ result: 'BUSY'; native: Native; waitMs: number | null }>
  | Said<'UNREADABLE'>
  | Said<'APP_REFUSED'>
  | Readonly<{ result: 'READ_REFUSED'; read: string; native: Native }>
  | Readonly<{ result: 'UNREACHABLE'; native: Native | null }>

type Deps = { executor: Executor; session: ConnectionSession; callDeadlineMs: number }

/**
 * Testar's second step: the connection's token, then the connector's check read once (Airbyte's
 * `check`, Nango's `verification`), each within one call's deadline; the session renews a token the
 * provider calls expired and repeats once. Nothing read leaves this function.
 */
export async function checked(deps: Deps, opened: OpenedConnection): Promise<Checked> {
  const { check } = opened.connector
  const input = check.probe(new Map())
  if (input === null) throw new Error(`Check ${check.id} has no input`)
  const answered = await deps.session.call(
    (token) => deps.executor.call(opened, bearerOf(token), check, input, deps.callDeadlineMs),
    AbortSignal.timeout(deps.callDeadlineMs),
  )
  switch (answered.kind) {
    case 'OK':
      return { result: 'WORKING' }
    case 'REFUSED':
      // A request the provider found wrong proves nothing about access (n8n's unverified): it answered with an error.
      return deniesAccess(answered.native)
        ? { result: 'READ_REFUSED', read: check.label, native: answered.native }
        : { result: 'UNREACHABLE', native: answered.native }
    case 'BUSY':
      return { result: 'BUSY', native: answered.native, waitMs: answered.waitMs }
    case 'AUTH_REFUSED':
    case 'TOKEN_EXPIRED':
    case 'NEEDS_REAUTH':
      return { result: 'AUTH_REFUSED', native: answered.native }
    case 'UNREADABLE':
      return { result: 'UNREADABLE', native: answered.native }
    case 'APP_REFUSED':
      return { result: 'APP_REFUSED', native: answered.native }
    case 'UNREACHABLE':
      return { result: 'UNREACHABLE', native: answered.native }
    default:
      return answered satisfies never
  }
}
