import type { CompanyId, ConversationId, NetworkDomain } from '@conexus/hub-api'
import type { FailureLog } from '../../platform/failure.ts'
import { causeChain, Failure } from '../../platform/failure.ts'
import type { Kit } from './kit.ts'

export type Opened = (where: {
  companyId: CompanyId
  conversationId: ConversationId
}) => Promise<readonly NetworkDomain[]>

export type NetworkLists = {
  opened: Opened
  onRemoved(listener: (companyId: CompanyId) => void): unknown
}

type NetworkChange = 'START' | 'GRANT' | 'REMOVE' | 'CONFER'

export type NetworkedSession = {
  conversationId: ConversationId
  /** Absent for a download's session. */
  companyId: CompanyId | undefined
  kit: Kit
  /** The change that did not take effect: the next use of the machine makes it again. */
  networkStale: NetworkChange | undefined
  /** The app's host, an entry of the list while the browser check of its screen runs. */
  conferring?: string | undefined
}

export type Line = ConversationId | `network:${ConversationId}`

type Deps = {
  opened: Opened
  log: FailureLog
  sessions: ReadonlyMap<ConversationId, NetworkedSession>
  inLane<T>(line: Line, work: () => Promise<T>): Promise<T>
}

export function networkNotApplied(): Failure {
  return new Failure('MACHINE_UNAVAILABLE', { details: { reason: 'NETWORK' } })
}

/** Mastra wraps what `onStart` throws, keeping it as the `cause`. */
export function isNetworkNotApplied(cause: unknown): boolean {
  return causeChain(cause).some(
    (each) => each instanceof Failure && each.details.reason === 'NETWORK',
  )
}

async function replaceList(session: NetworkedSession, opened: Opened) {
  const { companyId, conversationId, kit, conferring } = session
  const listed = companyId === undefined ? [] : await opened({ companyId, conversationId })
  return kit.openNetwork(conferring === undefined ? listed : [...listed, conferring])
}

export function machineNetwork({ opened, log, sessions, inLane }: Deps) {
  /**
   * The changes of one machine's list run in turn, each reading the lists when it runs, so the last
   * one wins. The cause of a failure is not logged: it may name a domain (security S41).
   */
  function change(session: NetworkedSession, reason: NetworkChange): Promise<boolean> {
    const { conversationId } = session
    return inLane(`network:${conversationId}`, async () => {
      try {
        await replaceList(session, opened)
        session.networkStale = undefined
        return true
      } catch {
        session.networkStale = reason
        log.error({ conversationId, reason }, 'MACHINE_NETWORK_FAILED')
        return false
      }
    })
  }

  /** A change reaches a running machine now; any other takes the lists at its next start. */
  function changeRunning(session: NetworkedSession | undefined, reason: NetworkChange) {
    if (session?.kit.sandbox.status !== 'running') return Promise.resolve(true)
    return change(session, reason)
  }

  function changeHeld(conversationId: ConversationId, reason: NetworkChange) {
    return inLane(conversationId, () => changeRunning(sessions.get(conversationId), reason))
  }

  function confer(session: NetworkedSession, host: string | undefined) {
    session.conferring = host
    return change(session, 'CONFER')
  }

  return {
    change,
    changeRunning,
    conference: (session: NetworkedSession) => ({
      async open(host: string): Promise<void> {
        if (!(await confer(session, host))) throw networkNotApplied()
      },
      async close(): Promise<void> {
        await confer(session, undefined)
      },
    }),
    reopen: (conversationId: ConversationId) => changeHeld(conversationId, 'GRANT'),
    async narrow(companyId: CompanyId): Promise<void> {
      const held = [...sessions.values()].filter((each) => each.companyId === companyId)
      await Promise.all(held.map((each) => changeHeld(each.conversationId, 'REMOVE')))
    },
  }
}
