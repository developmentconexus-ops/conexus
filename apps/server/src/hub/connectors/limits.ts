import type { ConnectionId } from '@conexus/hub-api'
import type { BearerToken, Executor, Login, OpenedConnection } from './executor.ts'

// A token this close to its end is renewed before a call, with room left for the old one's logout:
// an expired Sankhya token's logout is refused, and its session hangs (measured 2026-10-30).
const EARLY_MS = 60_000
const LOGOUT_DEADLINE_MS = 3_000

/** What `inTurn` answers to a waiter whose deadline passed in the queue. */
type Deadline = Readonly<{ kind: 'DEADLINE' }>

/** One per Hub process (0058): each connection's calls one at a time, and a pasted-key connection's token reused, renewed with a logout first. */
export type Limits = {
  /** Runs `work` when the connection's turn comes; DEADLINE when `deadlineMs` passes in the queue. */
  inTurn<T>(
    connection: ConnectionId,
    deadlineMs: number,
    work: (waitedMs: number) => Promise<T>,
  ): Promise<T | Deadline>
  /** The live token, or one login (the old token logged out first, while it lives). */
  token(opened: OpenedConnection, deadlineMs: number): Promise<Login>
  /** A 401 on `token`: dropped when it is still the current one. */
  invalidate(opened: OpenedConnection, token: BearerToken): void
  /** Desligar, Conectar de novo: log out and forget. */
  forget(connection: ConnectionId): Promise<void>
  /** The Hub's end: log out every live token, never throwing, within `deadlineMs`. */
  closeAll(deadlineMs: number): Promise<void>
}

type Seat = Pick<OpenedConnection, 'id' | 'connector'>
type TokenState =
  | Readonly<{ kind: 'NONE' }>
  | Readonly<{ kind: 'LIVE'; token: BearerToken; expiresAt: number }>
  | Readonly<{ kind: 'RENEWING'; done: Promise<Login> }>

/** The calls of one connection: `busy` while one runs, the rest waiting in arrival order. */
type Lane = { busy: boolean; waiting: Set<() => void> }
type Held = { seat: Seat; state: TokenState }

const NONE = { kind: 'NONE' } as const

/** Each connection's calls one at a time, the rest waiting in arrival order until their own deadline. */
function createLanes(): Pick<Limits, 'inTurn'> {
  const lanes = new Map<ConnectionId, Lane>()

  /** True when the turn is this caller's; false when its deadline passed first, and it left the line. */
  function turnOf(lane: Lane, deadlineMs: number): Promise<boolean> {
    if (!lane.busy) {
      lane.busy = true
      return Promise.resolve(true)
    }
    return new Promise((resolve) => {
      const signal = AbortSignal.timeout(deadlineMs)
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

  function passTurn(id: ConnectionId, lane: Lane): void {
    const [next] = lane.waiting
    if (next === undefined) {
      lane.busy = false
      lanes.delete(id)
      return
    }
    lane.waiting.delete(next)
    next()
  }

  return {
    async inTurn(connection, deadlineMs, work) {
      let lane = lanes.get(connection)
      if (lane === undefined) {
        lane = { busy: false, waiting: new Set() }
        lanes.set(connection, lane)
      }
      const started = performance.now()
      if (!(await turnOf(lane, deadlineMs))) return { kind: 'DEADLINE' }
      try {
        return await work(performance.now() - started)
      } finally {
        passTurn(connection, lane)
      }
    },
  }
}

/** Each live token's own end: logged out before it expires, since an expired token's logout is refused. */
function createEndings(held: Map<ConnectionId, Held>, executor: Executor) {
  const timers = new Map<ConnectionId, NodeJS.Timeout>()

  function stop(id: ConnectionId): void {
    clearTimeout(timers.get(id))
    timers.delete(id)
  }

  return {
    stop,
    stopAll(): void {
      for (const id of [...timers.keys()]) stop(id)
    },
    schedule(opened: OpenedConnection, token: BearerToken, expiresAt: number): void {
      stop(opened.id)
      const timer = setTimeout(
        () => {
          timers.delete(opened.id)
          const now = held.get(opened.id)?.state
          if (now?.kind !== 'LIVE' || now.token !== token) return
          held.set(opened.id, { seat: opened, state: NONE })
          void executor.logout(opened, token, LOGOUT_DEADLINE_MS)
        },
        Math.max(0, expiresAt - EARLY_MS - Date.now()),
      )
      timer.unref()
      timers.set(opened.id, timer)
    },
  }
}

/** The one token of each pasted-key connection: reused while it lives, renewed with the old one's logout first. */
function createTokens(executor: Executor): Omit<Limits, 'inTurn'> {
  const held = new Map<ConnectionId, Held>()
  const endings = createEndings(held, executor)

  async function login(opened: OpenedConnection, deadlineMs: number): Promise<Login> {
    const answered = await executor.login(opened, deadlineMs)
    if (answered.kind !== 'TOKEN') {
      held.set(opened.id, { seat: opened, state: NONE })
      return answered
    }
    const expiresAt = Date.now() + answered.expiresInSeconds * 1000
    held.set(opened.id, { seat: opened, state: { kind: 'LIVE', token: answered.token, expiresAt } })
    endings.schedule(opened, answered.token, expiresAt)
    return { kind: 'TOKEN', token: answered.token }
  }

  async function renew(
    opened: OpenedConnection,
    old: BearerToken | null,
    deadlineMs: number,
  ): Promise<Login> {
    try {
      if (old !== null) await executor.logout(opened, old, Math.min(deadlineMs, LOGOUT_DEADLINE_MS))
      return await login(opened, deadlineMs)
    } finally {
      // A login that threw leaves no half-renewal for the next caller to wait on.
      if (held.get(opened.id)?.state.kind === 'RENEWING')
        held.set(opened.id, { seat: opened, state: NONE })
    }
  }

  return {
    token(opened, deadlineMs) {
      const now = held.get(opened.id)?.state ?? NONE
      if (now.kind === 'LIVE' && now.expiresAt - EARLY_MS > Date.now())
        return Promise.resolve({ kind: 'TOKEN', token: now.token })
      if (now.kind === 'RENEWING') return now.done
      const done = renew(opened, now.kind === 'LIVE' ? now.token : null, deadlineMs)
      held.set(opened.id, { seat: opened, state: { kind: 'RENEWING', done } })
      return done
    },

    invalidate(opened, token) {
      const now = held.get(opened.id)?.state
      if (now?.kind === 'LIVE' && now.token === token) {
        endings.stop(opened.id)
        held.set(opened.id, { seat: opened, state: NONE })
      }
    },

    async forget(connection) {
      const now = held.get(connection)
      endings.stop(connection)
      held.delete(connection)
      if (now?.state.kind === 'LIVE')
        await executor.logout(now.seat, now.state.token, LOGOUT_DEADLINE_MS)
    },

    async closeAll(deadlineMs) {
      const live = [...held.values()].flatMap((entry) =>
        entry.state.kind === 'LIVE' ? [{ seat: entry.seat, token: entry.state.token }] : [],
      )
      held.clear()
      endings.stopAll()
      await Promise.all(live.map((one) => executor.logout(one.seat, one.token, deadlineMs)))
    },
  }
}

export function createLimits(deps: { executor: Executor }): Limits {
  return { ...createLanes(), ...createTokens(deps.executor) }
}
