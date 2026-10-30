import type { Native, Operation, OperationId } from '@conexus/connectors'
import { inProbeOrder } from '@conexus/connectors'
import type { TestCheck } from '@conexus/hub-api'
import type { BearerToken, Executor, OpenedConnection } from './executor.ts'

export type Probed =
  | Readonly<{ result: 'WORKING'; checks: TestCheck[] }>
  | Readonly<{ result: 'AUTH_REFUSED'; native: Native }>
  | Readonly<{ result: 'UNREADABLE'; native: Native }>
  | Readonly<{ result: 'UNREACHABLE'; native: Native | null }>

type Deadlines = { executor: Executor; callDeadlineMs: number; testDeadlineMs: number }
type Ended = Exclude<Probed, { result: 'WORKING' }>
/** What one call came to, before the item's name is put on it. */
type Result =
  | Readonly<{ outcome: 'READS' | 'NOTHING_TO_READ' | 'NOT_TESTED' }>
  | Readonly<{ outcome: 'REFUSED' | 'UNREADABLE'; native: Native }>

/** The end of the whole test by what the executor answered (the login, or a call that cannot go on). */
function endedBy(
  answer:
    | Readonly<{ kind: 'AUTH_REFUSED' | 'UNREADABLE'; native: Native }>
    | Readonly<{ kind: 'UNREACHABLE'; native: Native | null }>,
): Ended {
  switch (answer.kind) {
    case 'AUTH_REFUSED':
      return { result: 'AUTH_REFUSED', native: answer.native }
    case 'UNREADABLE':
      return { result: 'UNREADABLE', native: answer.native }
    case 'UNREACHABLE':
      return { result: 'UNREACHABLE', native: answer.native }
    default:
      return answer satisfies never
  }
}

/** The first source the operation reads from that did not read (refused, unreadable or not tested): a null probe would then say nothing about the item. A source that read nothing did read. */
function unread(
  operation: Operation<unknown, unknown>,
  outcomes: ReadonlyMap<OperationId, TestCheck>,
) {
  return operation.from
    .map((id) => outcomes.get(id))
    .find(
      (check) =>
        check !== undefined && check.outcome !== 'READS' && check.outcome !== 'NOTHING_TO_READ',
    )
}

/**
 * Testar's second step: a new token, then each door entry and each read operation once, in that
 * order and one at a time (the connector's `oneRequestAtATime`). Each call gets the shorter of its
 * own deadline and what is left of the whole test's, counted from the first login: an item the
 * deadline does not reach, or cuts short, is NOT_TESTED, and a login that does not fit is
 * UNREACHABLE; a provider that fails with time left is UNREACHABLE too. An expired token is asked again once per call. Nothing read leaves this function
 * but each item's outcome.
 */
export async function probed(deps: Deadlines, opened: OpenedConnection): Promise<Probed> {
  const { executor } = deps
  const { connector } = opened
  const endsAt = performance.now() + deps.testDeadlineMs
  const earlier = new Map<OperationId, unknown>()
  const outcomes = new Map<OperationId, TestCheck>()
  const first = await login()
  if (first.kind !== 'TOKEN') return endedBy(first)
  let token: BearerToken = first.token

  function left() {
    return endsAt - performance.now()
  }

  /** Less than a whole millisecond is no time: the timer takes no fraction. */
  function spent() {
    return left() < 1
  }

  /** What a call may take, in whole milliseconds (the timer refuses a fraction), never below 0. */
  function allowed() {
    return Math.max(0, Math.floor(Math.min(deps.callDeadlineMs, left())))
  }

  async function login() {
    const deadlineMs = allowed()
    return deadlineMs === 0
      ? ({ kind: 'UNREACHABLE', native: null } as const)
      : executor.login(opened, deadlineMs)
  }

  /** The item's outcome, or the end of the whole test (the key refused, the provider down). */
  async function read(operation: Operation<unknown, unknown>): Promise<Result | Ended> {
    const input = operation.probe(earlier)
    if (input === null) return { outcome: 'NOTHING_TO_READ' }
    let answered = await executor.call(opened, token, operation, input, allowed())
    if (answered.kind === 'TOKEN_EXPIRED') {
      const again = await login()
      if (again.kind !== 'TOKEN') return endedBy(again)
      token = again.token
      answered = await executor.call(opened, token, operation, input, allowed())
    }
    switch (answered.kind) {
      case 'OK':
        earlier.set(operation.id, answered.value)
        return { outcome: answered.empty ? 'NOTHING_TO_READ' : 'READS' }
      case 'REFUSED':
      case 'UNREADABLE':
        return { outcome: answered.kind, native: answered.native }
      case 'AUTH_REFUSED':
      case 'TOKEN_EXPIRED':
        return { result: 'AUTH_REFUSED', native: answered.native }
      case 'UNREACHABLE':
        // Judged after the call: the whole test's deadline ending it is an item not reached, any other end is the provider down.
        return spent() ? { outcome: 'NOT_TESTED' } : endedBy(answered)
      default:
        return answered satisfies never
    }
  }

  const checks: TestCheck[] = []
  for (const operation of inProbeOrder(connector)) {
    const subject = connector.subjects[operation.subject] ?? operation.subject
    const item = { id: operation.id, label: operation.label, subject }
    const check = await checked(operation, item)
    if ('result' in check) return check
    outcomes.set(operation.id, check)
    checks.push(check)
  }
  return { result: 'WORKING', checks }

  /**
   * The deadline first: past it the true reason is the delay, even for an item whose source did not
   * read; then the sources, then the call.
   */
  async function checked(
    operation: Operation<unknown, unknown>,
    item: Omit<TestCheck, 'outcome'>,
  ): Promise<TestCheck | Ended> {
    if (spent()) return { ...item, outcome: 'NOT_TESTED' }
    const source = unread(operation, outcomes)
    if (source !== undefined) return { ...item, outcome: 'SOURCE_UNREAD', source: source.label }
    const result = await read(operation)
    return 'result' in result ? result : { ...item, ...result }
  }
}
