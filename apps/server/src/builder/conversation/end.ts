import { randomUUID } from 'node:crypto'
import type { ConversationId, FailureData, ThoughtData } from '@conexus/hub-api'
import {
  ConversationId as ConversationIdSchema,
  RunId,
  THOUGHT_PART,
  TurnFailureCode,
} from '@conexus/hub-api'
import type {
  AgentController,
  AgentControllerEvent,
  MastraDBMessage,
  MastraMessagePart,
  Session,
} from '@mastra/core/agent-controller'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Phase } from '../machine/public.ts'
import type { Runs, Settled } from '../runs/public.ts'
import type { Builder } from './builder.ts'
import { FINISHES, TurnTally, turnLine } from './turn-line.ts'
import { busyIn, ownerOfResource } from './turn-of.ts'

type AgentEnd = NonNullable<Extract<AgentControllerEvent, { type: 'agent_end' }>['reason']>

/**
 * What this process knows of a Mastra run of a conversation, from its `agent_start` to its
 * `agent_end`: what its line counts, the failure its error said, and our clock of its thinking.
 */
type Run = {
  runId: RunId
  startedAt: string
  tally: TurnTally
  failure: FailureData | undefined
  /** When each reasoning began, by its message and place, until the first part after it. */
  thinking: Map<string, number>
  /** Our parts of the run: how long each thinking took, and a machine replaced. */
  parts: MastraMessagePart[]
  /** The failure `onBeforeAgentEnd` decided, for the run's line. */
  failed: FailureData['code'] | undefined
  over: PromiseWithResolvers<void>
}

function newRun(session: Session): Run {
  const id = session.run.getRunId()
  return {
    runId: RunId.parse(id ?? randomUUID()),
    startedAt: new Date().toISOString(),
    tally: new TurnTally(),
    failure: undefined,
    thinking: new Map(),
    parts: [],
    failed: undefined,
    over: Promise.withResolvers<void>(),
  }
}

/**
 * The failure a run's error is the run's: the Projeto busy (`turnOf`), or one of ours the queue
 * said (`MODEL_NO_ACCOUNT`); none for the model's own.
 */
function failureOf(error: Error): FailureData | undefined {
  const busy = busyIn(error)
  if (busy !== undefined)
    return busy.person === undefined
      ? { code: 'RUN_BUSY' }
      : { code: 'RUN_BUSY', person: busy.person }
  if (!(error instanceof Failure)) return undefined
  const code = TurnFailureCode.safeParse(error.code)
  return code.success ? { code: code.data } : undefined
}

/**
 * The run's failure, decided once (the failures table of the card): one its error said first, then
 * the save, then how the model's turn ended, never the provider's text (security S41).
 */
function decided(
  run: Run,
  reason: AgentEnd,
  outcome: Settled | 'gone' | 'threw',
): FailureData | undefined {
  if (run.failure !== undefined) return run.failure
  if (outcome === 'threw') return { code: 'INTERNAL_UNEXPECTED' }
  if (outcome !== 'gone' && outcome.kind === 'failed') return { code: outcome.code }
  if (reason !== 'error') return undefined
  const finish = run.tally.finishReason
  return { code: (finish === undefined ? undefined : FINISHES[finish]) ?? 'MODEL_CALL_FAILED' }
}

/** The thinking in progress ends with the first part after it: how long it took, by our clock. */
function settleThinking(run: Run): void {
  for (const [id, since] of run.thinking) {
    const seconds = Math.ceil((Date.now() - since) / 1000)
    run.parts.push({ type: THOUGHT_PART, data: { id, seconds } satisfies ThoughtData })
  }
  run.thinking.clear()
}

function startThinking(run: Run, message: string, index: number): void {
  const key = `${message}.${index}`
  if (!run.thinking.has(key)) run.thinking.set(key, Date.now())
}

/** What a run keeps of each event: its line's counts, its error's failure and the thinking clock. */
function heard(run: Run, event: AgentControllerEvent): void {
  run.tally.heard(event)
  if (event.type === 'error') run.failure ??= failureOf(event.error)
  if (event.type === 'message_start' && event.message.role === 'assistant') {
    for (const [index, part] of event.message.content.parts.entries()) {
      if (part.type === 'reasoning') startThinking(run, event.message.id, index)
    }
  }
  if (event.type !== 'message_update') return
  const { event: update } = event
  if (update.type === 'reasoning-delta') {
    startThinking(run, event.id, update.index)
    return
  }
  settleThinking(run)
  if (update.type === 'part' && update.part.type === 'reasoning') {
    startThinking(run, event.id, update.index)
  }
  if (update.type === 'part' && update.part.type === 'tool-invocation') {
    const call = update.part.toolInvocation
    if (call.state === 'output-error') run.tally.failed(call.toolName)
  }
}

type Deps = { controller: AgentController; memory: Builder['memory']; runs: Runs; log: FailureLog }

/**
 * A message of ours on the conversation, told on its stream as Mastra tells its own: a
 * `message_start` with the whole message, and its `message_end`.
 */
function tell(session: Session, message: MastraDBMessage): void {
  session.emit({ type: 'message_start', message })
  session.emit({ type: 'message_end', id: message.id })
}

function oursOf(
  session: Session,
  conversationId: ConversationId,
  parts: MastraMessagePart[],
): MastraDBMessage {
  return {
    id: randomUUID(),
    role: 'assistant',
    createdAt: new Date(),
    threadId: conversationId,
    resourceId: session.identity.getResourceId(),
    content: { format: 2, parts },
  }
}

/**
 * The run ends, for any reason, a question or a plan included (`suspended`): its version is saved
 * by the conversation, its failure decided once, and our parts kept on the thread as one message
 * and told on the stream, before Mastra says `agent_end`, never sent to the model (criteria 30, 48).
 */
async function ended(deps: Deps, session: Session, run: Run, reason: AgentEnd): Promise<void> {
  const conversationId = ConversationIdSchema.parse(session.identity.getId())
  // A save that throws is this run's failure, said and logged here: Mastra would print the
  // listener's error raw, and the run would end without saying why.
  const outcome = await deps.runs.finish({ conversationId, reason }).catch((cause: unknown) => {
    logFailure(deps.log, new Failure('INTERNAL_UNEXPECTED', { cause }))
    return 'threw' as const
  })
  settleThinking(run)
  const parts = [...run.parts]
  if (outcome !== 'threw' && outcome !== 'gone') {
    run.tally.rounds = outcome.rounds
    if (outcome.kind === 'saved')
      parts.push({ type: 'data-conexus-version', data: outcome.version })
  }
  const failure = decided(run, reason, outcome)
  run.failed = failure?.code
  if (failure !== undefined) parts.push({ type: 'data-conexus-failure', data: failure })
  if (parts.length === 0) return
  const message = oursOf(session, conversationId, parts)
  try {
    await deps.memory.saveMessages({ messages: [message] })
  } catch (cause) {
    logFailure(deps.log, new Failure('INTERNAL_UNEXPECTED', { cause }))
  }
  tell(session, message)
}

/** The machine's step, told live as a message of ours that is not kept. */
function tellPhase(session: Session, phase: Phase): void {
  const conversationId = ConversationIdSchema.parse(session.identity.getId())
  const part: MastraMessagePart = { type: 'data-conexus-machine', data: { phase } }
  tell(session, { ...oursOf(session, conversationId, [part]), id: `${conversationId}:machine` })
}

/**
 * Every Mastra run of every conversation, from the session Mastra makes for it: its end saved by
 * the conversation (`onBeforeAgentEnd`, core `agent-controller-DO6rGsQm.js:4836-4859`), and its
 * line in the log at `agent_end` (security S41). `drain` stops the runs in flight as Parar does,
 * so each saves what it wrote, and waits for their ends (code C62).
 */
export function watchRuns(deps: Deps) {
  const running = new Map<string, { session: Session; run: Run }>()
  const unheard = new Map<string, () => void>()
  deps.controller.onSessionCreated((session) => {
    const conversationId = ConversationIdSchema.parse(session.identity.getId())
    const owner = ownerOfResource(session.identity.getResourceId())
    const fields = { ...(owner && { companyId: owner.companyId }), conversationId }
    let run: Run | undefined
    session.subscribe((event) => {
      if (event.type === 'agent_start') {
        run = newRun(session)
        running.set(conversationId, { session, run })
        deps.log.info({ ...fields, runId: run.runId }, 'CONVERSATION_TURN_STARTED')
      }
      if (run === undefined) return
      heard(run, event)
      if (event.type !== 'agent_end') return
      const line = turnLine({
        ...{ runId: run.runId, startedAt: run.startedAt, tally: run.tally },
        ...{ end: event.reason ?? 'complete', errorCode: run.failed },
      })
      deps.log.info(
        { ...fields, reason: event.reason ?? 'complete', ...line },
        'CONVERSATION_TURN_ENDED',
      )
      run.over.resolve()
      running.delete(conversationId)
      run = undefined
    })
    session.onBeforeAgentEnd(async ({ reason }) => {
      if (run !== undefined) await ended(deps, session, run, reason ?? 'complete')
    })
    unheard.set(
      conversationId,
      deps.runs.onPhase(conversationId, (phase) => tellPhase(session, phase)),
    )
  })
  // A deleted session's run ends without an `agent_end` (Mastra's `deleteSession` aborts it locally).
  deps.controller.onSessionDeleted((session) => {
    const conversationId = session.identity.getId()
    running.get(conversationId)?.run.over.resolve()
    running.delete(conversationId)
    unheard.get(conversationId)?.()
    unheard.delete(conversationId)
  })
  return {
    async drain(): Promise<void> {
      // Mastra starts a run of its own at an abort with a message still unread: it is stopped too.
      while (running.size > 0) {
        const inFlight = [...running.values()]
        for (const { session } of inFlight) session.abort()
        await Promise.all(inFlight.map(({ run }) => run.over.promise))
      }
    },
  }
}
