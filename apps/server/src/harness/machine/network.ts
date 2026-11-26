import type { CompanyId, ConversationId } from '@conexus/hub-api'
import type { FailureLog } from '../../platform/failure.ts'
import { causeChain, Failure } from '../../platform/failure.ts'
import type { NetworkStore } from '../network/public.ts'
import type { Kit } from './kit.ts'
import { createLanes } from './lanes.ts'

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

type Deps = {
  opened: NetworkStore['opened']
  log: FailureLog
  sessions: ReadonlyMap<ConversationId, NetworkedSession>
  /** The queue the conversation's pauses run in, where its owner pauses machines. */
  amongPauses?<T>(conversationId: ConversationId, work: () => Promise<T>): Promise<T>
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

async function replaceList(session: NetworkedSession, opened: NetworkStore['opened']) {
  const { companyId, conversationId, kit, conferring } = session
  if (companyId === undefined) return kit.openNetwork([])
  const listed = await opened({ companyId, conversationId })
  switch (listed.kind) {
    case 'ALL':
      return kit.openAll()
    case 'LIST':
      return kit.openNetwork(
        conferring === undefined ? listed.hosts : [...listed.hosts, conferring],
      )
    default:
      return listed satisfies never
  }
}

/** The classes along a failure's causes and no message, which may name a domain (security S41). */
function classesOf(error: unknown): string {
  return causeChain(error)
    .map((each) => (each instanceof Error ? each.constructor.name : typeof each))
    .join(' < ')
}

export function machineNetwork({ opened, log, sessions, amongPauses = (_, work) => work() }: Deps) {
  const inTurn = createLanes<ConversationId>()

  /**
   * The changes of one machine's list run in turn, each reading the lists when it runs, so the last
   * one wins.
   */
  function change(session: NetworkedSession, reason: NetworkChange): Promise<boolean> {
    const { conversationId } = session
    return inTurn(conversationId, async () => {
      try {
        await replaceList(session, opened)
        session.networkStale = undefined
        return true
      } catch (error) {
        session.networkStale = reason
        const causes = classesOf(error)
        log.error({ conversationId, reason, causes }, 'MACHINE_NETWORK_FAILED')
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
    return amongPauses(conversationId, () => changeRunning(sessions.get(conversationId), reason))
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
