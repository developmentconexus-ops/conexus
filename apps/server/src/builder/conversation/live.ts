import type { CompanyId, ConversationId, PersonId, RunId, TurnFailureCode } from '@conexus/hub-api'
import type { Session } from '@mastra/core/agent-controller'
import type { RequestContext } from '@mastra/core/request-context'
import type { Turn } from '../model-accounts/public.ts'
import type { Settled } from '../runs/public.ts'
import type { Recorder } from './record.ts'
import type { Listener, TurnLog } from './turn-log.ts'

export type { Question } from './record.ts'
export type { Listener } from './turn-log.ts'

export type Owner = { companyId: CompanyId; personId: PersonId }

/** A run Mastra woke for one of this conversation's messages, until its end. */
type Run = { turn: Turn; ended: () => void }

/** A conversation open in this process: its controller session and its turn. */
export type Live = Recorder & {
  conversationId: ConversationId
  session: Session
  listeners: Set<Listener>
  turn: TurnLog | undefined
  /** The turns of the messages sent and not yet over: their run, or the one they joined, runs. */
  asked: Set<Turn>
  /** The runs a message of this conversation woke (Mastra's `wake`), by Mastra's run id. */
  runs: Map<string, Run>
  /**
   * The last run that ended before its message learned its id, as Mastra's own wait allows
   * (`waitForAcceptedRunCompletion`): its message does not wait for an end already past, and ends
   * the turn itself, since only it knows which turn the run was.
   */
  unclaimed: { run: string; reason: Ending['reason'] } | undefined
  /**
   * Messages Mastra accepted into the running turn (`deliver`) and has not put on the transcript yet,
   * by message id; read once its `message_start` (`role: 'signal'`) comes.
   */
  pending: Set<string>
  /**
   * The turn going on in the next run Mastra starts: a message closed its card, or Mastra keeps input
   * the ending run never read. Set before that run's end, filled with its run, taken at `agent_start`.
   */
  carry: { run: Run | undefined } | undefined
  /** Mastra is about to end the run (`beforeAgentEnd` began): a message now waits for the turn's end. */
  ending: boolean
  /** Removes messages Mastra has not read (`cancelQueuedMessages`), before a Parar aborts. */
  cancel: (signalIds: string[]) => void
  /** The run of the message in progress: ends and saves it when Mastra's run is about to end. */
  run:
    | {
        id: RunId
        traceId: string
        /** What Mastra needs of the turn to go on after an answer or a message. */
        context: RequestContext
        finish: (reason: string) => Promise<Settled | 'gone'>
        /** The run waits on the person's answer, or goes on after it; rejects when the database refuses. */
        waiting: (waiting: boolean) => Promise<void>
      }
    | undefined
  /** Why the turn ended badly, for its end to say: a save that failed, or a question that expired (card, the failures table). */
  saveFailure: TurnFailureCode | undefined
  unsubscribe: () => void
}

export type Ending = {
  reason: 'complete' | 'aborted' | 'error' | 'suspended' | undefined
  turn: Turn | undefined
  /** How the model finished, when Mastra said it was not a normal finish (`TurnTally.finishReason`). */
  finish: string | undefined
  unexpected?: TurnFailureCode
}

/** Unread messages leave Mastra's queue before a Parar or an abort ends the turn. */
export function cancelPending(live: Live): void {
  live.cancel([...live.pending])
  live.pending.clear()
}
