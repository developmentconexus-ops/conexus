import type {
  ConversationId,
  Effort,
  EventId,
  MessageId,
  ModelId,
  OMProgress,
  ProjectId,
  QuestionAnswer,
  ToolCallId,
} from '@conexus/hub-api'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import { memoryModelsFor, Turn } from '../model-accounts/public.ts'
import type { Restart, Run, Runs } from '../runs/public.ts'
import { answerCard } from './answers.ts'
import type { Builder } from './builder.ts'
import { memoryOwner } from './builder.ts'
import {
  adoptCards,
  detach,
  onCardEvent,
  openCards,
  parked,
  releaseCards,
  takeCards,
} from './cards.ts'
import { listen } from './listen.ts'
import type { Listener, Live, Owner } from './live.ts'
import { cancelPending } from './live.ts'
import type { Question } from './record.ts'
import { questionId, saveQuestion, saveRestarted } from './record.ts'
import { deliverInto, nextRunOrEnd, steerCards, turnOver } from './steer.ts'
import { beforeAgentEnd } from './turn-end.ts'
import { onEvent } from './turn-events.ts'
import { tellRestarted } from './turn-parts.ts'
import { adoptTurn, answerTurn } from './turn-run.ts'
import { isOpen, logOf, writingOf } from './turn-state.ts'

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
        ...{ state: { kind: 'idle' }, pending: new Set() },
        cancel: (signalIds) => {
          if (signalIds.length === 0) return
          const target = { resourceId, threadId: conversationId, signalIds }
          this.#builder.agent.cancelQueuedMessages(target)
        },
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
    // A closed session ends no run, so its message stops waiting here.
    writingOf(live.state)?.ended()
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
      if (live === undefined || !isOpen(live.state)) break // no turn of this conversation here
      if (await steerCards(live, { question: input.question, id })) return
      if (live.state.kind === 'closing' || live.state.kind === 'ending') {
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
    const memoryModels = await memoryModelsFor(this.#builder.queue, owner)
    const turn = new Turn({ ...owner, memoryModels })
    const kept = this.#hold(input).then(async (live) => {
      try {
        await saveQuestion(live, input.question)
      } catch (error) {
        await this.#release(conversationId, live)
        throw error
      }
      return live
    })
    const answered: Promise<void> = kept
      .then(
        async (live) => {
          try {
            const run = { runId, traceId: input.traceId }
            await answerTurn(live, { runs: this.#runs, log: this.#log }, input.question, turn, run)
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
    await this.#settled(input)
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
   * A run another copy left on a card: this copy takes the turn on, with the card open, and its
   * answer, Parar, expiry or a message go on here as on the copy that asked (founder 2026-10-24,
   * "4. B"); false when Mastra parks no card of it.
   */
  async adopt(run: Run): Promise<boolean> {
    const owner = { companyId: run.companyId, personId: run.personId }
    const { conversationId } = run
    const live = await this.#hold({ owner, conversationId })
    const parkedRuns = await adoptCards(live, this.#builder.agent).catch(async (error: unknown) => {
      await this.#release(conversationId, live)
      throw error
    })
    if (parkedRuns.length === 0) {
      await this.#release(conversationId, live)
      return false
    }
    const answered: Promise<void> = adoptTurn(live, this.#runs, run, this.#builder.queue)
      .finally(() => this.#release(conversationId, live))
      .catch((cause: unknown) =>
        logFailure(this.#log, new Failure('INTERNAL_UNEXPECTED', { cause })),
      )
      .finally(() => this.#turns.delete(answered))
    this.#turns.set(answered, Promise.resolve(live))
    return true
  }

  /**
   * Settles the conversation's runs another copy left, when none is open here: an answer or a
   * Parar can come before this copy's boot took them.
   */
  async #settled({ owner, conversationId }: OfConversation): Promise<void> {
    const live = this.#lives.get(conversationId)
    if (live !== undefined && isOpen(live.state)) return
    await this.#runs.settleConversation({ companyId: owner.companyId, conversationId })
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
   * Tells the conversation's open streams that a turn another copy of the program ran, with no card
   * parked, was ended by a restart, and keeps the restart on the thread after the person's question
   * that turn answered (card, the restart).
   */
  async restarted(restart: Restart): Promise<void> {
    const { companyId, personId, conversationId, runId, kept } = restart
    const live = await this.#hold({ owner: { companyId, personId }, conversationId })
    try {
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
    return live === undefined ? undefined : logOf(live.state)?.after
  }

  /** Stops the answer in progress; Mastra keeps the text so far (`agent_end` `aborted`). */
  async stop(input: OfConversation): Promise<void> {
    const { conversationId } = input
    await this.#settled(input)
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
   * it is detached with its card open, and the copy that takes its run adopts it.
   */
  async drain(): Promise<void> {
    const turns = [...this.#turns].map(([answered, kept]) =>
      Promise.race([
        answered.then(() => undefined),
        kept.then(
          async (live) => {
            await parked(live)
            return live
          },
          () => answered.then(() => undefined),
        ),
      ]),
    )
    for (const live of new Set(await Promise.all(turns))) {
      if (live !== undefined && openCards(live).length > 0) detach(live)
    }
    this.#closing.abort()
  }

  /** Closes a conversation's session before its thread is deleted, aborting its turn. */
  async forget(conversationId: ConversationId): Promise<void> {
    const live = this.#lives.get(conversationId)
    if (live !== undefined) await this.#close(conversationId, live)
  }
}
