import type { Native } from '@conexus/connectors'
import type { Executor, OpenedConnection } from './executor.ts'
import type { Access } from './tokens.ts'

type Said<R extends string> = Readonly<{ result: R; native: Native }>

/**
 * What Testar's one check came to: n8n's accepted, rejected and unverified, with the provider's
 * answer kept. READ_REFUSED: the key was taken, the check read was not (`read` names it).
 */
export type Checked =
  | Readonly<{ result: 'WORKING' }>
  | Said<'AUTH_REFUSED'>
  | Said<'BUSY'>
  | Said<'UNREADABLE'>
  | Said<'APP_REFUSED'>
  | Readonly<{ result: 'READ_REFUSED'; read: string; native: Native }>
  | Readonly<{ result: 'UNREACHABLE'; native: Native | null }>

type Deps = { executor: Executor; access: Access; callDeadlineMs: number }

/** The token's own end: refused, unreadable, unreachable, or the installation's app refused. */
function endedBy(answer: Exclude<Awaited<ReturnType<Access['token']>>, { kind: 'TOKEN' }>): Checked {
  return answer.kind === 'UNREACHABLE'
    ? { result: 'UNREACHABLE', native: answer.native }
    : { result: answer.kind, native: answer.native }
}

/**
 * Testar's second step: the connection's token, then the connector's check read once (Airbyte's
 * `check`, Nango's `verification`), each within one call's deadline. A token the provider calls
 * expired is asked again, forced, once. Nothing read leaves this function.
 */
export async function checked(deps: Deps, opened: OpenedConnection): Promise<Checked> {
  const { check } = opened.connector
  const input = check.probe(new Map())
  if (input === null) throw new Error(`Check ${check.id} has no input`)
  const deadlineMs = deps.callDeadlineMs
  const first = await deps.access.token(opened, { force: false, deadlineMs })
  if (first.kind !== 'TOKEN') return endedBy(first)
  let answered = await deps.executor.call(opened, first.token, check, input, deadlineMs)
  if (answered.kind === 'TOKEN_EXPIRED') {
    const refused = answered.native
    const again = await deps.access.token(opened, { force: true, deadlineMs, refused })
    if (again.kind !== 'TOKEN') return endedBy(again)
    answered = await deps.executor.call(opened, again.token, check, input, deadlineMs)
  }
  switch (answered.kind) {
    case 'OK':
      return { result: 'WORKING' }
    case 'REFUSED':
      return { result: 'READ_REFUSED', read: check.label, native: answered.native }
    case 'AUTH_REFUSED':
    case 'TOKEN_EXPIRED':
      return { result: 'AUTH_REFUSED', native: answered.native }
    case 'UNREADABLE':
      // The kernel reads a 429 as an answer it cannot read; for the check it is the provider asking to wait.
      return answered.native.status === 429
        ? { result: 'BUSY', native: answered.native }
        : { result: 'UNREADABLE', native: answered.native }
    case 'UNREACHABLE':
      return { result: 'UNREACHABLE', native: answered.native }
    default:
      return answered satisfies never
  }
}
