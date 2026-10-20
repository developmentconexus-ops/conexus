import type {
  CompanyId,
  ConversationEvent,
  ConversationId,
  Message,
  MessagePart,
  PersonId,
  TurnFailureCode,
} from '@conexus/hub-api'
import type { AgentControllerEvent, Session } from '@mastra/core/agent-controller'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import type { Turn } from '../model-accounts/public.ts'
import { partOf } from './parts.ts'

export type Owner = { companyId: CompanyId; personId: PersonId }
export type Listener = (event: ConversationEvent) => void

/** The person's questions not yet saved by Mastra, kept on the thread so a crash loses none. */
export const QUESTION_KEY = 'conexus.questions'
/** One kept question, named by its message's Idempotency-Key. */
export const Question = z.object({ key: z.uuid(), content: z.string(), at: z.iso.datetime() })
export type Question = z.infer<typeof Question>

type Notice = Extract<MessagePart, { type: 'notice' }>

/** A run Mastra woke for one of this conversation's messages, until its end. */
type Run = { turn: Turn; ended: () => void }

/** A conversation open in this process: its controller session and the answer in progress. */
export type Live = {
  conversationId: ConversationId
  owner: Owner
  log: FailureLog
  session: Session
  listeners: Set<Listener>
  /** The Builder's answer since its `message_start`. */
  answer: Message | undefined
  /** The queue's notices said before the answer started, which it then begins with. */
  notices: Notice[]
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
  /** The questions on the thread, and the write of them in flight, one after the other. */
  questions: Question[]
  kept: Promise<void>
  unsubscribe: () => void
}

function emit(live: Live, event: ConversationEvent): void {
  for (const listener of live.listeners) listener(event)
}

function appendText(answer: Message, delta: string): void {
  const last = answer.parts.at(-1)
  if (last?.type === 'text') last.text += delta
  else answer.parts.push({ type: 'text', text: delta })
}

/**
 * What a stream that opens now reads first: the answer so far, the notices said before it, or
 * that a turn runs and has said nothing yet.
 */
export function snapshotOf(live: Live): ConversationEvent[] {
  if (live.answer !== undefined) return [{ type: 'turn', message: structuredClone(live.answer) }]
  if (live.notices.length > 0) {
    return live.notices.map((notice) => ({ type: 'notice', text: notice.text }))
  }
  return live.asked.size > 0 || live.runs.size > 0 ? [{ type: 'working' }] : []
}

function onMessageEvent(live: Live, event: AgentControllerEvent): void {
  if (event.type === 'message_start' && event.message.role === 'assistant') {
    const kept = live.answer?.parts.filter((part) => part.type === 'notice') ?? []
    const createdAt = new Date(event.message.createdAt).toISOString()
    const parts = [...kept, ...live.notices.splice(0)]
    live.answer = { id: event.message.id, role: 'builder', parts, createdAt }
  } else if (event.type === 'message_update' && live.answer !== undefined) {
    if (event.event.type === 'text-delta') {
      appendText(live.answer, event.event.delta)
      emit(live, { type: 'text', delta: event.event.delta })
    } else if (event.event.type === 'part') {
      const part = partOf(event.event.part)
      if (part !== undefined && part.type !== 'text') {
        live.answer.parts.push(part)
        emit(live, { type: 'part', part })
      }
    }
  }
}

/** The controller's events as the person's: text, pages read, notices, the title, the turn's end. */
export function onEvent(live: Live, event: AgentControllerEvent): void {
  if (event.type === 'info') {
    const notice: Notice = { type: 'notice', text: event.message }
    if (live.answer === undefined) live.notices.push(notice)
    else live.answer.parts.push(notice)
    emit(live, { type: 'notice', text: event.message })
  } else if (event.type === 'thread_title_updated') {
    emit(live, { type: 'title', title: event.title })
  } else if (event.type === 'agent_end') {
    // Mastra still names the ending run when it says so (`finishAgentRun`).
    const runId = live.session.run.getRunId()
    const run = runId === null ? undefined : live.runs.get(runId)
    if (runId !== null) live.runs.delete(runId)
    if (runId !== null && run === undefined && live.asked.size > 0) {
      live.unclaimed = { run: runId, reason: event.reason }
      return
    }
    endTurn(live, { reason: event.reason, turn: run?.turn })
    run?.ended()
  } else onMessageEvent(live, event)
}

type Ending = {
  reason: 'complete' | 'aborted' | 'error' | 'suspended' | undefined
  turn: Turn | undefined
  unexpected?: TurnFailureCode
}

/**
 * The end of a turn, said once: a failed one says why first, by how the queue ended its run's
 * turn, never the provider's text (security S41); `suspended` cannot happen, since the Builder has
 * no tool that waits.
 */
export function endTurn(live: Live, ending: Ending) {
  const ended =
    ending.reason === 'error' || ending.reason === 'aborted' ? ending.reason : 'complete'
  if (ended === 'error') {
    const exhausted = ending.turn?.outcome === 'exhausted'
    const code = ending.unexpected ?? (exhausted ? 'MODEL_NO_ACCOUNT' : 'MODEL_CALL_FAILED')
    emit(live, { type: 'failure', code })
  }
  live.answer = undefined
  live.notices = []
  const { conversationId, owner } = live
  const fields = { companyId: owner.companyId, conversationId, reason: ended }
  live.log.info(fields, 'CONVERSATION_TURN_ENDED')
  emit(live, { type: 'turnEnd', reason: ended })
}

/**
 * Keeps the person's question on the thread (Mastra saves a run's messages only at its end): with
 * the others of the run in progress, or alone when no other message is in flight, since the
 * earlier ones are saved. The writes go one after the other, so the last one holds every question.
 */
export function keepQuestion(live: Live, question: Question): Promise<void> {
  const running = live.asked.size > 0 || live.session.stream.isActive()
  const others = live.questions.filter((each) => each.key !== question.key)
  live.questions = running ? [...others, question] : [question]
  const value = live.questions
  // biome-ignore lint/plugin: a write that failed went to its own message's sender; this one only waits for the queue to settle (code C37)
  const kept = live.kept
    // A write that failed went to its own message's sender, which frees its key (code C37).
    .catch(() => undefined)
    .then(() => live.session.thread.setSetting({ key: QUESTION_KEY, value }))
  live.kept = kept
  return kept
}
