import type { Grant, Session } from '@conexus/connectors'
import { RENEW_BEFORE_MS, sessionOf } from '@conexus/connectors'
import type { ConnectionId } from '@conexus/hub-api'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Executor, LoginFailure, OpenedConnection } from './executor.ts'

type PastedSession = Session<LoginFailure>

const LOGOUT_DEADLINE_MS = 3_000
// The scheduled logout waits for its turn up to this, well inside the margin before the token's end.
const ENDING_TURN_MS = 30_000

/** What `inTurn` answers to a waiter whose deadline passed in the queue. */
type Deadline = Readonly<{ kind: 'DEADLINE' }>

export type Limits = {
  /**
   * Runs `work` when the connection's turn comes; DEADLINE when `deadlineMs` passes in the queue, or
   * when `signal` (the caller's turn stopped) aborts there: a caller already stopped never takes a turn.
   */
  inTurn<T>(
    connection: ConnectionId,
    deadlineMs: number,
    work: (waitedMs: number) => Promise<T>,
    signal?: AbortSignal,
  ): Promise<T | Deadline>
  /** The connection's session, one per process: its token reused, renewed with the old one's logout first, and logged out before it expires. */
  session(opened: OpenedConnection): PastedSession
  /** Desligar, Conectar de novo: log out and forget. */
  forget(connection: ConnectionId): Promise<void>
  /** The Hub's end: log out every live token, never throwing, within `deadlineMs`. */
  closeAll(deadlineMs: number): Promise<void>
}

/** The calls of one connection: `busy` while one runs, the rest waiting in arrival order. */
type Lane = { busy: boolean; waiting: Set<() => void> }
type InLane<K> = <T>(
  key: K,
  deadlineMs: number,
  work: (waitedMs: number) => Promise<T>,
  signal?: AbortSignal,
) => Promise<T | Deadline>

/** Each key's calls one at a time, the rest waiting in arrival order until their own deadline. */
function createLanes<K>(): InLane<K> {
  const lanes = new Map<K, Lane>()

  /** True when the turn is this caller's; false when its deadline passed first, and it left the line. */
  function turnOf(lane: Lane, deadlineMs: number, stopped?: AbortSignal): Promise<boolean> {
    if (stopped?.aborted === true) return Promise.resolve(false)
    if (!lane.busy) {
      lane.busy = true
      return Promise.resolve(true)
    }
    return new Promise((resolve) => {
      const deadline = AbortSignal.timeout(deadlineMs)
      const signal = stopped === undefined ? deadline : AbortSignal.any([deadline, stopped])
      function give() {
        signal.removeEventListener('abort', leave)
        resolve(true)
      }
      function leave() {
        lane.waiting.delete(give)
        resolve(false)
      }
      lane.waiting.add(give)
      signal.addEventListener('abort', leave, { once: true })
    })
  }

  function passTurn(id: K, lane: Lane): void {
    const [next] = lane.waiting
    if (next === undefined) {
      lane.busy = false
      lanes.delete(id)
      return
    }
    lane.waiting.delete(next)
    next()
  }

  return async (key, deadlineMs, work, signal) => {
    let lane = lanes.get(key)
    if (lane === undefined) {
      lane = { busy: false, waiting: new Set() }
      lanes.set(key, lane)
    }
    const started = performance.now()
    if (!(await turnOf(lane, deadlineMs, signal))) {
      // A caller that left an idle lane's entry behind would keep the map's key alive.
      if (!lane.busy) lanes.delete(key)
      return { kind: 'DEADLINE' }
    }
    try {
      return await work(performance.now() - started)
    } finally {
      passTurn(key, lane)
    }
  }
}

type Ending = { grant: Grant | null; timer: NodeJS.Timeout | undefined }
type Held = Readonly<{ session: PastedSession; ending: Ending }>

type SessionDeps = Readonly<{
  executor: Executor
  inTurn: Limits['inTurn']
  log: FailureLog
  now: () => Date
}>

function createSessions(deps: SessionDeps): Omit<Limits, 'inTurn'> {
  const { executor, inTurn, log } = deps
  const held = new Map<ConnectionId, Held>()
  function clock(): number {
    return deps.now().getTime()
  }

  function stop(ending: Ending): void {
    clearTimeout(ending.timer)
    ending.timer = undefined
  }

  /** Never throws: a defect in the logout is logged, so the other connections still close. */
  async function close(id: ConnectionId, entry: Held, deadlineMs: number): Promise<void> {
    stop(entry.ending)
    try {
      await entry.session.close(AbortSignal.timeout(deadlineMs))
    } catch (error) {
      logFailure(log, new Failure('INTERNAL_UNEXPECTED', { cause: error }), { connection: id })
    }
  }

  /** The end of `grant`, in the connection's turn like every call: a logout on a token with a read open is refused. */
  function schedule(id: ConnectionId, ending: Ending, grant: Grant): void {
    stop(ending)
    ending.grant = grant
    const timer = setTimeout(
      () => {
        ending.timer = undefined
        inTurn(id, ENDING_TURN_MS, async () => {
          const entry = held.get(id)
          if (entry?.ending !== ending || ending.grant !== grant) return
          held.delete(id)
          await close(id, entry, LOGOUT_DEADLINE_MS)
        }).catch((error: unknown) =>
          logFailure(log, new Failure('INTERNAL_UNEXPECTED', { cause: error }), { connection: id }),
        )
      },
      Math.max(0, grant.expiresAt - RENEW_BEFORE_MS - clock()),
    )
    timer.unref()
    ending.timer = timer
  }

  return {
    session(opened) {
      const found = held.get(opened.id)
      if (found !== undefined) return found.session
      const source = executor.pasted(opened)
      const ending: Ending = { grant: null, timer: undefined }
      const session = sessionOf<LoginFailure>(
        {
          ...source,
          async open(a) {
            const opening = await source.open(a)
            if (opening.kind === 'TOKEN') schedule(opened.id, ending, opening)
            return opening
          },
        },
        clock,
      )
      held.set(opened.id, { session, ending })
      return session
    },

    async forget(connection) {
      const entry = held.get(connection)
      if (entry === undefined) return
      held.delete(connection)
      await close(connection, entry, LOGOUT_DEADLINE_MS)
    },

    async closeAll(deadlineMs) {
      const live = [...held]
      held.clear()
      await Promise.all(live.map(([id, entry]) => close(id, entry, deadlineMs)))
    },
  }
}

export function createLimits(deps: Omit<SessionDeps, 'inTurn'>): Limits {
  const inTurn = createLanes<ConnectionId>()
  return {
    inTurn,
    ...createSessions({ ...deps, inTurn }),
  }
}
