import type { CompanyId, ConversationId, PersonId } from '@conexus/hub-api'
import type { Session } from '@mastra/core/agent-controller'
import type { Recorder } from './record.ts'
import type { Listener } from './turn-log.ts'
import type { TurnState } from './turn-state.ts'

export type { Question } from './record.ts'
export type { Listener } from './turn-log.ts'

export type Owner = { companyId: CompanyId; personId: PersonId }

/** A conversation open in this process: its controller session and its turn. */
export type Live = Recorder & {
  conversationId: ConversationId
  session: Session
  listeners: Set<Listener>
  /** The conversation's turn, moved only by the transitions of `turn-state.ts`. */
  state: TurnState
  /**
   * Messages Mastra accepted into the running turn (`deliver`) and has not put on the transcript yet,
   * by message id; read once its `message_start` (`role: 'signal'`) comes.
   */
  pending: Set<string>
  /** Removes messages Mastra has not read (`cancelQueuedMessages`), before a Parar aborts. */
  cancel: (signalIds: string[]) => void
  unsubscribe: () => void
}

/** Unread messages leave Mastra's queue before a Parar or an abort ends the turn. */
export function cancelPending(live: Live): void {
  live.cancel([...live.pending])
  live.pending.clear()
}
