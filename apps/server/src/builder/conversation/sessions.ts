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
import { isSessionStartupCancelledError } from '@mastra/core/agent-controller'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import { memoryModelsFor, Turn, turnContext } from '../model-accounts/public.ts'
import type { Runs } from '../runs/public.ts'
import { claimAnswer } from './answers.ts'
import type { Builder } from './builder.ts'
import { memoryOwner } from './builder.ts'
import { openCards, restoreCards } from './cards.ts'
import { deliver } from './deliver.ts'
import { listen } from './listen.ts'
import type { Listener, Live, Owner } from './live.ts'
import { cancelPending } from './live.ts'
import type { Question } from './record.ts'
import { questionId, saveQuestion, settled } from './record.ts'
import { deliverInto, steerCards } from './steer.ts'
import { beforeAgentEnd, endUnstarted, runTurn } from './turn-end.ts'
import { onEvent } from './turn-events.ts'
import { beginTurn, tellMachine } from './turn-parts.ts'
import type { Writing } from './turn-state.ts'
import { ended, isOpen, logOf, writingOf } from './turn-state.ts'

type OfConversation = { owner: Owner; conversationId: ConversationId }
type OfTurn = OfConversation & { projectId: ProjectId; traceId: string }

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
  // Every turn from its admission to its end, for the drain to wait on.
  readonly #turns = new Set<Promise<void>>()
  // Ends every stream once the turns are drained, so the server's close does not wait on them.
  readonly #closing = new AbortController()

  constructor(deps: { builder: Builder; runs: Runs; log: FailureLog }) {
    this.#builder = deps.builder
    this.#runs = deps.runs
    this.#log = deps.log
  }

  /**
   * The conversation's session, held until `#release`. Mastra's `createSession` is get-or-create
   * and waits for a `deleteSession` in flight, so the holder counts before it waits. A session made
   * here takes the cards Mastra keeps for the conversation.
   */
  async #hold({ owner, conversationId }: OfConversation): Promise<Live> {
    this.#holds.set(conversationId, (this.#holds.get(conversationId) ?? 0) + 1)
    const resourceId = memoryOwner(owner)
    try {
      const session = await this.#builder.controller.createSession({
        resourceId,
        id: conversationId,
        threadId: conversationId,
      })
      const found = this.#lives.get(conversationId)
      if (found !== undefined) return found
      const opened: Live = {
        ...{ conversationId, owner, log: this.#log, session, listeners: new Set<Listener>() },
        ...{ memory: this.#builder.memory, kept: Promise.resolve() },
        ...{ state: { kind: 'idle' }, pending: new Set(), closing: new Set() },
        cancel: (signalIds) => {
          if (signalIds.length === 0) return
          const target = { resourceId, threadId: conversationId, signalIds }
          this.#builder.agent.cancelQueuedMessages(target)
        },
        unsubscribe: () => undefined,
      }
      this.#lives.set(conversationId, opened)
      const unsubscribe = session.subscribe((event) => onEvent(opened, event))
      const unhook = session.onBeforeAgentEnd((event) => beforeAgentEnd(opened, event.reason))
      opened.unsubscribe = () => {
        unsubscribe()
        unhook()
      }
      await restoreCards(opened, this.#builder.agent)
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
    // A closed session ends no run, so its turn stops waiting here.
    writingOf(live.state)?.ended()
    // Mastra's `deleteSession` denies the cards a session keeps; a card waits on the person, not on
    // this session, so it is let go first, as Mastra's detach keeps parked runs (`detachFromCurrent`).
    if (openCards(live).length > 0) live.session.thread.detachFromCurrent()
    await this.#builder.controller.deleteSession({ sessionId: conversationId })
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

  /** Opens the Projeto's run for a turn of the conversation, or refuses it with whose run holds it. */
  async #admit(input: OfTurn): Promise<RunId> {
    const admitted = await this.#runs.admit({
      ...input.owner,
      conversationId: input.conversationId,
      projectId: input.projectId,
    })
    if (!admitted.ok) throw new Failure('RUN_BUSY', { person: admitted.person })
    return admitted.value
  }

  /** What the turn of `runId` writes with on the conversation, and the hour that ends it. */
  async #writing(live: Live, runId: RunId, traceId: string): Promise<Writing> {
    const memoryModels = await memoryModelsFor(this.#builder.queue, live.owner)
    const turn = new Turn({ ...live.owner, memoryModels })
    const { promise: over, resolve } = Promise.withResolvers<void>()
    this.#runs.onPhase(runId, (phase) => tellMachine(live, phase))
    this.#runs.attach(runId, () => live.session.abort())
    const context = this.#runs.contextOf(turnContext(turn), runId)
    const finish = (reason: string) => this.#runs.finish({ runId, reason })
    return { id: runId, traceId, context, turn, finish, ended: resolve, over }
  }

  /**
   * A turn, from its start to Mastra's `agent_end`: `start` hands Mastra the message or the answer
   * and says whether a run of it began. However the wait ends, the run is finished (a closed run
   * answers `gone`) and the session let go.
   */
  #run(live: Live, writing: Writing, start: () => Promise<boolean>, after?: MessageId): void {
    const { companyId } = live.owner
    const { conversationId } = live
    this.#log.info({ companyId, conversationId }, 'CONVERSATION_TURN_STARTED')
    const opened = beginTurn(live, writing)
    const turn: Promise<void> = (async () => {
      try {
        opened.after ??= after
        if (!(await runTurn(live, writing, start))) {
          await endUnstarted(live, 'error', 'INTERNAL_UNEXPECTED')
        }
      } catch (cause) {
        // Mastra cancels a start that a Parar came first to (`SessionStartupCancelledError`).
        const stopped = isSessionStartupCancelledError(cause)
        if (!stopped) logFailure(this.#log, new Failure('INTERNAL_UNEXPECTED', { cause }))
        if (!live.session.stream.isActive()) {
          await endUnstarted(
            live,
            stopped ? 'aborted' : 'error',
            stopped ? undefined : 'INTERNAL_UNEXPECTED',
          )
        }
      } finally {
        writing.turn.end()
        if (writingOf(live.state) === writing) live.state = ended(live.state)
        await this.#runs.finish({ runId: writing.id, reason: 'error' })
        // The turn is over once what it keeps on the thread is written: the drain waits for that.
        await settled(live)
        await this.#release(conversationId, live)
      }
    })()
      .catch((cause: unknown) =>
        logFailure(this.#log, new Failure('INTERNAL_UNEXPECTED', { cause })),
      )
      .finally(() => this.#turns.delete(turn))
    this.#turns.add(turn)
  }

  /**
   * The person's message. While the Builder runs in this conversation, Mastra takes it into the run
   * (`requireDelivery`, criterion 12); otherwise it opens a turn of its own: the Projeto's run is
   * admitted, the question saved on the thread, and a card still open closed. Resolves once the
   * question is saved; the answer comes on the stream.
   */
  async send(input: OfTurn & { question: Question }): Promise<void> {
    const { owner, conversationId, question } = input
    const id = questionId(conversationId, question.key)
    const running = this.#lives.get(conversationId)
    if (running !== undefined && isOpen(running.state)) {
      // A turn whose run is being finished takes no message: it is the next turn's.
      if (running.state.end !== undefined) await running.state.writing.over
      else if ((await deliverInto(running, { question, id })) === 'delivered') {
        this.#log.info({ companyId: owner.companyId, conversationId }, 'CONVERSATION_STEERED')
        return
      }
    }
    const runId = await this.#admit(input)
    const live = await this.#hold(input).catch(async (error: unknown) => {
      await this.#runs.finish({ runId, reason: 'error' })
      throw error
    })
    // A card still open: the message is Mastra's `steer`, which saves the message as its own run's.
    const steering = openCards(live).length > 0
    let writing: Writing
    try {
      writing = await this.#writing(live, runId, input.traceId)
      if (!steering) await saveQuestion(live, question)
    } catch (error) {
      await this.#runs.finish({ runId, reason: 'error' })
      await this.#release(conversationId, live)
      throw error
    }
    const requestContext = writing.context
    if (steering) {
      this.#run(live, writing, () =>
        steerCards(live, { content: question.content, requestContext }),
      )
      return
    }
    // Mastra takes a trace id without dashes; the request's is the turn's (card, U10).
    const tracingOptions = { traceId: input.traceId.replaceAll('-', '') }
    const options = { requestContext, requireDelivery: true, tracingOptions } as const
    this.#run(
      live,
      writing,
      async () => {
        const accepted = await deliver(live, { question, id }, options)
        return 'runId' in accepted
      },
      id,
    )
  }

  /**
   * The person's answer to a card: the answers to its questions, or the decision on its plan, once
   * the turn that asked it ended. The call is claimed first, so a second answer is `QUESTION_CLOSED`;
   * then the Projeto's run is admitted and Mastra resumes the call by its address, as its own route does, from this session
   * or from its database. A resume Mastra refuses keeps the card open and ends the turn, saying so.
   */
  async answer(input: OfTurn & { toolCallId: ToolCallId; body: QuestionAnswer }): Promise<void> {
    const { conversationId, toolCallId } = input
    const live = await this.#hold(input)
    // The card is said before Mastra ends the run that asked it: the answer opens the next turn.
    if (isOpen(live.state)) await live.state.writing.over
    let claimed: ReturnType<typeof claimAnswer> | undefined
    let writing: Writing
    try {
      claimed = claimAnswer(live, input)
      writing = await this.#writing(live, await this.#admit(input), input.traceId)
    } catch (error) {
      if (claimed !== undefined) live.session.releaseToolResponse(claimed.claimKey)
      await this.#release(conversationId, live)
      throw error
    }
    const { address, claimKey, resumeData } = claimed
    this.#log.info({ companyId: input.owner.companyId, conversationId }, 'QUESTION_ANSWERED')
    this.#run(live, writing, async () => {
      try {
        const requestContext = writing.context
        await live.session.respondToToolSuspension({ address, resumeData, requestContext })
      } finally {
        live.session.releaseToolResponse(claimKey)
      }
      return !openCards(live).some((card) => card.toolCallId === toolCallId)
    })
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

  /** The memory's progress in the conversation's open session, or none when this process has none open. */
  memoryOf(conversationId: ConversationId): OMProgress | null {
    const live = this.#lives.get(conversationId)
    return live?.session.displayState.get().omProgress ?? null
  }

  /** The person's message that the turn in progress answers, or none: the stream tells that turn whole. */
  inProgressAfter(conversationId: ConversationId): MessageId | undefined {
    const live = this.#lives.get(conversationId)
    return live === undefined ? undefined : logOf(live.state)?.after
  }

  /**
   * Stops the answer in progress, and closes the cards open (`agent_end` `aborted`): Mastra keeps
   * the text so far, and the run saves what it wrote.
   */
  async stop(input: OfConversation): Promise<void> {
    const { conversationId } = input
    const live = await this.#hold(input)
    try {
      cancelPending(live)
      live.session.abort()
      this.#log.info({ companyId: live.owner.companyId, conversationId }, 'CONVERSATION_STOPPED')
    } finally {
      await this.#release(conversationId, live)
    }
  }

  /**
   * Stops every turn in progress as Parar does, so each saves what it wrote, waits for them to end,
   * then ends the streams (code C62); the caller holds the deadline. A card waits on a person, not
   * on this process: its turn ended when it asked.
   */
  async drain(): Promise<void> {
    for (const live of this.#lives.values()) {
      if (!isOpen(live.state)) continue
      cancelPending(live)
      live.session.abort()
    }
    await Promise.all(this.#turns)
    this.#closing.abort()
  }

  /** Closes a conversation's session before its thread is deleted, aborting its turn. */
  async forget(conversationId: ConversationId): Promise<void> {
    const live = this.#lives.get(conversationId)
    if (live !== undefined) await this.#close(conversationId, live)
  }
}
