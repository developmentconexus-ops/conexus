import type {
  ConversationId,
  Effort,
  EventId,
  MessageId,
  ModelId,
  OMProgress,
  ProjectId,
  QuestionAnswer,
  RunId,
  ToolCallId,
} from '@conexus/hub-api'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import { Turn, turnContext } from '../model-accounts/public.ts'
import type { Restart, Runs } from '../runs/public.ts'
import { answerCard } from './answers.ts'
import type { Builder } from './builder.ts'
import { memoryOwner } from './builder.ts'
import { denyParked, expire, onCardEvent, parked, releaseCards, takeCards } from './cards.ts'
import { deliver } from './deliver.ts'
import { listen } from './listen.ts'
import type { Listener, Live, Owner } from './live.ts'
import {
  beforeAgentEnd,
  cancelPending,
  endTurn,
  onEvent,
  openTurn,
  tellMachine,
  tellRestarted,
} from './live.ts'
import type { Question } from './record.ts'
import { questionId, saveQuestion, saveRestarted, settled } from './record.ts'
import { deliverInto, nextRunOrEnd, steerCards, turnOver } from './steer.ts'

type OfConversation = { owner: Owner; conversationId: ConversationId }

/**
 * The conversations open in this process (decision 0050): one controller session per conversation,
 * scoped by its id, so one person holds several at once; a session closes with its last stream
 * when no turn runs. Ownership was checked on the index before any call here.
 */
export class Sessions {
  readonly #builder: Builder
  readonly #runs: Runs
  readonly #log: FailureLog
  // Holders per conversation, counted synchronously, before any wait.
  readonly #holds = new Map<ConversationId, number>()
  // The conversations open here, set once Mastra's `createSession` resolves.
  readonly #lives = new Map<ConversationId, Live>()
  // Every message from its arrival to the end of its run, with its session, for the drain to wait on.
  readonly #turns = new Map<Promise<void>, Promise<Live>>()
  // Ends every stream once the turns are drained, so the server's close does not wait on them.
  readonly #closing = new AbortController()

  constructor(deps: {
    builder: Builder
    runs: Runs
    log: FailureLog
  }) {
    this.#builder = deps.builder
    this.#runs = deps.runs
    this.#log = deps.log
  }

  /**
   * The conversation's session, held until `#release`. Mastra's `createSession` is get-or-create
   * and waits for a `deleteSession` in flight, so the holder counts before it waits.
   */
  async #hold({ owner, conversationId }: OfConversation): Promise<Live> {
    this.#holds.set(conversationId, (this.#holds.get(conversationId) ?? 0) + 1)
    const resourceId = memoryOwner(owner)
    try {
      const session = await this.#builder.controller.createSession({
        resourceId,
        scope: conversationId,
        threadId: conversationId,
      })
      const found = this.#lives.get(conversationId)
      if (found !== undefined) return found
      const opened: Live = {
        ...{ conversationId, owner, log: this.#log, session, listeners: new Set<Listener>() },
        ...{ memory: this.#builder.memory, kept: Promise.resolve() },
        ...{ turn: undefined, asked: new Set(), runs: new Map() },
        ...{ pending: new Set(), carry: undefined, ending: false, unclaimed: undefined },
        cancel: (signalIds) => {
          if (signalIds.length === 0) return
          const target = { resourceId, threadId: conversationId, signalIds }
          this.#builder.agent.cancelQueuedMessages(target)
        },
        ...{ run: undefined, saveFailure: undefined },
        unsubscribe: () => undefined,
      }
      const unsubscribe = session.subscribe((event) => {
        onEvent(opened, event)
        onCardEvent(opened, event)
      })
      const unhook = session.onBeforeAgentEnd((event) => beforeAgentEnd(opened, event.reason))
      opened.unsubscribe = () => {
        unsubscribe()
        unhook()
      }
      this.#lives.set(conversationId, opened)
      return opened
    } catch (error) {
      this.#drop(conversationId)
      throw error
    }
  }

  #drop(conversationId: ConversationId): number {
    const holds = (this.#holds.get(conversationId) ?? 1) - 1
    if (holds > 0) this.#holds.set(conversationId, holds)
    else this.#holds.delete(conversationId)
    return holds
  }

  async #release(conversationId: ConversationId, live: Live): Promise<void> {
    if (this.#drop(conversationId) === 0) await this.#close(conversationId, live)
  }

  /** Closes this session, if it is still the conversation's: a newer one stays. */
  async #close(conversationId: ConversationId, live: Live): Promise<void> {
    if (this.#lives.get(conversationId) !== live) return
    this.#lives.delete(conversationId)
    live.unsubscribe()
    // A closed session ends no run, so its messages stop waiting here.
    for (const run of live.runs.values()) run.ended()
    live.runs.clear()
    const resourceId = memoryOwner(live.owner)
    await this.#builder.controller.deleteSession({ resourceId, scope: conversationId })
  }

  /**
   * Puts the conversation on a model and an effort, kept together on its thread (`switch`), for
   * its next turns.
   */
  async switchModel(input: OfConversation & { model: ModelId; effort: Effort }): Promise<void> {
    const live = await this.#hold(input)
    try {
      await live.session.model.switch(input.model, { thinkingLevel: input.effort })
    } finally {
      await this.#release(input.conversationId, live)
    }
  }

  /**
   * Saves the person's question on the thread, then sends it on a turn of its own, whose answer
   * comes on the stream; resolves once the question is saved.
   */
  async send(
    input: OfConversation & { projectId: ProjectId; question: Question; traceId: string },
  ): Promise<void> {
    const { owner, conversationId } = input
    const id = questionId(conversationId, input.question.key)
    for (let tries = 0; tries < 3; tries += 1) {
      const live = this.#lives.get(conversationId)
      if (live === undefined || live.run === undefined) break // no turn of this conversation here
      if (await steerCards(live, { question: input.question, id })) return
      if (live.ending) {
        await turnOver(live)
        break // the turn ended: this message is a turn of its own
      }
      if ((await deliverInto(live, { question: input.question, id })) === 'delivered') {
        this.#log.info({ companyId: owner.companyId, conversationId }, 'CONVERSATION_STEERED')
        return
      }
      // Between two runs of the turn (a card closed, or leftover input): wait for the next to start.
      await nextRunOrEnd(live)
    }
    const admitted = await this.#runs.admit({
      ...owner,
      conversationId,
      projectId: input.projectId,
    })
    if (!admitted.ok) throw new Failure('RUN_BUSY', { person: admitted.person })
    const runId = admitted.value
    const turn = new Turn(input.owner)
    const kept = this.#hold(input).then(async (live) => {
      const keeping = saveQuestion(live, input.question)
      live.asked.add(turn)
      try {
        await keeping
      } catch (error) {
        live.asked.delete(turn)
        await this.#release(conversationId, live)
        throw error
      }
      return live
    })
    const answered: Promise<void> = kept
      .then(
        async (live) => {
          try {
            await this.#answer(live, input.question, turn, { runId, traceId: input.traceId })
          } finally {
            await this.#release(conversationId, live)
          }
        },
        // The question was not saved: `send` throws it to the caller, and no turn starts.
        async () => {
          await this.#runs.finish({ runId, reason: 'error' })
        },
      )
      .catch((cause: unknown) =>
        logFailure(this.#log, new Failure('INTERNAL_UNEXPECTED', { cause })),
      )
      .finally(() => this.#turns.delete(answered))
    this.#turns.set(answered, kept)
    await kept
  }

  /**
   * The person's answer to the card the turn waits on: the answers to its questions, or the
   * decision on its plan. The call is claimed first, so a second answer is `QUESTION_CLOSED`.
   */
  async answer(
    input: OfConversation & {
      toolCallId: ToolCallId
      body: QuestionAnswer
    },
  ): Promise<void> {
    const live = await this.#hold(input)
    try {
      await answerCard(live, input)
      const fields = { companyId: input.owner.companyId, conversationId: input.conversationId }
      this.#log.info(fields, 'QUESTION_ANSWERED')
    } finally {
      await this.#release(input.conversationId, live)
    }
  }

  /**
   * Mastra decides where the message goes (`requireDelivery`): it wakes a run, which carries this
   * message's turn to the queue until that run's `agent_end`, or it joins the run in progress,
   * whose turn stays (criterion 12). `sendSignal` is `sendMessage`'s own call, which keeps that
   * decision to itself; the turn of each run is the one of the message that woke it, by Mastra's
   * run id, never the latest message's. A message Mastra could not route started no run: its
   * failure is the turn's end when no other run is in progress. A turn Mastra ran keeps its
   * failure after the message that opened it, the one it saves the turn after.
   */
  async #answer(
    live: Live,
    question: Question,
    turn: Turn,
    run: { runId: RunId; traceId: string },
  ): Promise<void> {
    const writing = run.runId
    const fields = { companyId: live.owner.companyId, conversationId: live.conversationId }
    this.#log.info(fields, 'CONVERSATION_TURN_STARTED')
    const id = questionId(live.conversationId, question.key)
    const requestContext = this.#runs.contextOf(turnContext(turn), writing)
    live.run = {
      id: writing,
      traceId: run.traceId,
      context: requestContext,
      finish: (reason) => this.#runs.finish({ runId: writing, reason }),
      waiting: (waiting) => this.#runs.waiting(writing, waiting, () => expire(live)),
    }
    const opened = openTurn(live)
    this.#runs.attach(writing, () => live.session.abort())
    this.#runs.onPhase(writing, (phase) => tellMachine(live, phase))
    try {
      // Mastra takes a trace id without dashes; the request's is the turn's (card, U10).
      const tracingOptions = { traceId: run.traceId.replaceAll('-', '') }
      const options = { requestContext, requireDelivery: true, tracingOptions } as const
      const accepted = await deliver(live, { question, id }, options)
      opened.after ??= id
      const runId = accepted.action === 'wake' ? accepted.runId : undefined
      if (runId !== undefined && live.unclaimed?.run === runId) {
        const { reason } = live.unclaimed
        live.unclaimed = undefined
        endTurn(live, { reason, turn, finish: live.turn?.tally.finishReason })
      } else if (runId !== undefined) {
        await new Promise<void>((ended) => live.runs.set(runId, { turn, ended }))
      }
    } catch (cause) {
      logFailure(this.#log, new Failure('INTERNAL_UNEXPECTED', { cause }))
      if (live.runs.size === 0 && !live.session.stream.isActive()) {
        endTurn(live, {
          reason: 'error',
          turn,
          finish: undefined,
          unexpected: 'INTERNAL_UNEXPECTED',
        })
      }
    } finally {
      live.asked.delete(turn)
      turn.end()
      live.run = undefined
      await this.#runs.finish({ runId: writing, reason: 'error' })
      if (live.unclaimed !== undefined && live.asked.size === 0) {
        const { reason } = live.unclaimed
        live.unclaimed = undefined
        endTurn(live, { reason, turn: undefined, finish: live.turn?.tally.finishReason })
      }
      // The turn is over once what it keeps on the thread is written: the drain waits for that.
      await settled(live)
    }
  }

  /**
   * The conversation's events: those after `lastEventId` or the turn in progress so far, then each
   * new one, until `signal`. It listens before it returns, so a message sent once the stream is
   * open loses none of its events.
   */
  async events(input: OfConversation & { signal: AbortSignal; lastEventId: EventId | null }) {
    const live = await this.#hold(input)
    const release = () => this.#release(input.conversationId, live)
    return listen(live, { ...input, release, closing: this.#closing.signal })
  }

  /**
   * Tells the conversation's open streams that a turn another copy of the program ran was ended by
   * a restart, and keeps the restart on the thread after the person's question that turn answered
   * (card, the restart).
   */
  async restarted(restart: Restart): Promise<void> {
    const { companyId, personId, conversationId, runId, kept } = restart
    const live = await this.#hold({ owner: { companyId, personId }, conversationId })
    try {
      await denyParked(live, this.#builder.agent)
      await saveRestarted(live, { runId, kept })
      tellRestarted(live, runId, kept)
    } finally {
      await this.#release(conversationId, live)
    }
  }

  /** The memory's progress in the conversation's open session, or none when this process has none open. */
  memoryOf(conversationId: ConversationId): OMProgress | null {
    const live = this.#lives.get(conversationId)
    return live?.session.displayState.get().omProgress ?? null
  }

  /** The person's message that the turn in progress answers, or none: the stream tells that turn whole. */
  inProgressAfter(conversationId: ConversationId): MessageId | undefined {
    const live = this.#lives.get(conversationId)
    return live?.turn?.ended === false ? live.turn.after : undefined
  }

  /** Stops the answer in progress; Mastra keeps the text so far (`agent_end` `aborted`). */
  async stop(conversationId: ConversationId): Promise<void> {
    const live = this.#lives.get(conversationId)
    if (live === undefined) return
    const taken = await takeCards(live)
    cancelPending(live)
    live.session.abort()
    releaseCards(live, taken)
    const fields = { companyId: live.owner.companyId, conversationId }
    this.#log.info(fields, 'CONVERSATION_STOPPED')
  }

  /**
   * Waits for every message and turn in progress until it ends or parks, then ends the streams
   * (code C62); the caller holds the deadline. A parked turn waits on a person, not on this copy:
   * Mastra keeps it on the thread, and the copy that takes its run settles it.
   */
  async drain(): Promise<void> {
    const turns = [...this.#turns].map(([answered, kept]) =>
      Promise.race([answered, kept.then(parked, () => answered)]),
    )
    await Promise.all(turns)
    this.#closing.abort()
  }

  /** Closes a conversation's session before its thread is deleted, aborting its turn. */
  async forget(conversationId: ConversationId): Promise<void> {
    const live = this.#lives.get(conversationId)
    if (live !== undefined) await this.#close(conversationId, live)
  }
}
