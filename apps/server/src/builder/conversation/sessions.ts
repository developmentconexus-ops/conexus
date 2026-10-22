import type {
  ConversationId,
  Effort,
  EventId,
  MessageId,
  ModelId,
  ProjectId,
  QuestionAnswer,
  RunId,
  ToolCallId,
} from '@conexus/hub-api'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import { Turn, turnContext } from '../model-accounts/public.ts'
import type { Restart, Runs } from '../runs/public.ts'
import { answerCard } from './answers.ts'
import type { Builder } from './builder.ts'
import { memoryOwner } from './builder.ts'
import { denyParked, expire, onCardEvent, releaseCards, steerCards, takeCards } from './cards.ts'
import { deliver } from './deliver.ts'
import { keepPart, QUESTION_KEY, Question } from './kept.ts'
import { listen } from './listen.ts'
import type { Listener, Live, Owner } from './live.ts'
import {
  beforeAgentEnd,
  endTurn,
  keepQuestion,
  onEvent,
  openTurn,
  questionId,
  tellMachine,
} from './live.ts'
import { eventId } from './turn-log.ts'

/**
 * A conversation's place in this process: its session, opening or open, and how many holders use
 * it, each counted before its first wait, so the session closes only once none is left.
 */
type Entry = { live: Promise<Live>; holds: number }

/** The entry's session, or none when it never opened: the failure reached every holder of the entry. */
async function opened(entry: Entry | undefined): Promise<Live | undefined> {
  // biome-ignore lint/plugin: the failure to open reached every holder of the entry; a session that never opened has nothing to close, ask or stop
  return entry?.live.catch(() => undefined)
}

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
  readonly #open = new Map<ConversationId, Entry>()
  // Every message from its arrival to the end of its run, for the drain to wait on.
  readonly #turns = new Set<Promise<void>>()
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

  /** The conversation's entry, opened if needed and held, before any wait (`#release`). */
  #hold({ owner, conversationId }: OfConversation): Entry {
    const found = this.#open.get(conversationId)
    if (found !== undefined) {
      found.holds += 1
      return found
    }
    const resourceId = memoryOwner(owner)
    const live = this.#builder.controller
      .createSession({ resourceId, scope: conversationId, threadId: conversationId })
      .then((session) => {
        const opened: Live = {
          ...{ conversationId, owner, log: this.#log, session, listeners: new Set<Listener>() },
          ...{
            journal: (runId, event) =>
              this.#runs.append({ companyId: owner.companyId, runId, event }),
            lose: () => session.abort(),
          },
          ...{ turn: undefined, asked: new Set(), runs: new Map() },
          ...{ steering: undefined },
          ...{ unclaimed: undefined, questions: [], kept: Promise.resolve() },
          ...{ run: undefined, saveFailure: undefined, saved: undefined },
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
        return opened
      })
    const entry: Entry = { live, holds: 1 }
    this.#open.set(conversationId, entry)
    // Each holder awaits `live` and meets its failure; here the entry only leaves the map.
    live.catch(() => this.#close(conversationId, entry))
    return entry
  }

  async #release(conversationId: ConversationId, entry: Entry): Promise<void> {
    entry.holds -= 1
    if (entry.holds === 0) await this.#close(conversationId, entry)
  }

  /** Closes this entry's session, if it is still the conversation's: a newer one stays. */
  async #close(conversationId: ConversationId, entry: Entry): Promise<void> {
    if (this.#open.get(conversationId) !== entry) return
    this.#open.delete(conversationId)
    const live = await opened(entry)
    if (live === undefined) return
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
    const entry = this.#hold(input)
    try {
      const { session } = await entry.live
      await session.model.switch(input.model, { thinkingLevel: input.effort })
    } finally {
      await this.#release(input.conversationId, entry)
    }
  }

  /**
   * Keeps the person's question on the thread, then sends it on a turn of its own, whose answer
   * comes on the stream; resolves once the question is kept.
   */
  async send(
    input: OfConversation & { projectId: ProjectId; question: Question; traceId: string },
  ): Promise<void> {
    const { owner, conversationId } = input
    const waiting = await opened(this.#open.get(conversationId))
    if (waiting !== undefined && (await steerCards(waiting, input.question))) return
    const admitted = await this.#runs.admit({
      ...owner,
      conversationId,
      projectId: input.projectId,
    })
    if (!admitted.ok) throw new Failure('RUN_BUSY', { person: admitted.person })
    const runId = admitted.value
    const entry = this.#hold(input)
    const turn = new Turn(input.owner)
    const kept = entry.live.then(async (live) => {
      const keeping = keepQuestion(live, input.question)
      live.asked.add(turn)
      try {
        await keeping
      } catch (error) {
        live.asked.delete(turn)
        throw error
      }
      return live
    })
    const answered: Promise<void> = kept
      .then(
        (live) => this.#answer(live, input.question, turn, { runId, traceId: input.traceId }),
        // The question was not kept: `send` throws it to the caller, and no turn starts.
        () => this.#runs.finish({ runId, reason: 'error' }),
      )
      .then(() => this.#release(input.conversationId, entry))
      .catch((cause: unknown) =>
        logFailure(this.#log, new Failure('INTERNAL_UNEXPECTED', { cause })),
      )
      .finally(() => this.#turns.delete(answered))
    this.#turns.add(answered)
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
    const entry = this.#hold(input)
    try {
      await answerCard(await entry.live, input)
      const fields = { companyId: input.owner.companyId, conversationId: input.conversationId }
      this.#log.info(fields, 'QUESTION_ANSWERED')
    } finally {
      await this.#release(input.conversationId, entry)
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
        endTurn(live, { reason, turn })
      } else if (runId !== undefined) {
        await new Promise<void>((ended) => live.runs.set(runId, { turn, ended }))
      }
    } catch (cause) {
      logFailure(this.#log, new Failure('INTERNAL_UNEXPECTED', { cause }))
      if (live.runs.size === 0 && !live.session.stream.isActive()) {
        endTurn(live, { reason: 'error', turn, unexpected: 'INTERNAL_UNEXPECTED' })
      }
    } finally {
      live.asked.delete(turn)
      turn.end()
      live.run = undefined
      await this.#runs.finish({ runId: writing, reason: 'error' })
      if (live.unclaimed !== undefined && live.asked.size === 0) {
        const { reason } = live.unclaimed
        live.unclaimed = undefined
        endTurn(live, { reason, turn: undefined })
      }
      // The turn is over once its last event is journaled and sent: the drain waits for that.
      await live.turn?.queue
    }
  }

  /**
   * The conversation's events: those after `lastEventId`, or the turn in progress first, then each
   * new one, until `signal`. It listens before it returns, so a message sent once the stream is
   * open loses none of its events.
   */
  async events(input: OfConversation & { signal: AbortSignal; lastEventId: EventId | null }) {
    const entry = this.#hold(input)
    const release = () => this.#release(input.conversationId, entry)
    const live = await entry.live.catch(async (error: unknown) => {
      await release()
      throw error
    })
    return await listen(live, {
      ...input,
      release,
      runs: this.#runs,
      closing: this.#closing.signal,
    })
  }

  /**
   * Tells the conversation's open streams what a restart said of a turn another copy of the program
   * ran, and keeps its lasting part on the thread after the person's last message, which that turn
   * answered (card, the restart).
   */
  async restarted(restart: Restart): Promise<void> {
    const { companyId, personId, conversationId } = restart
    const entry = this.#hold({ owner: { companyId, personId }, conversationId })
    try {
      const live = await entry.live
      await denyParked(live, this.#builder.agent)
      const asked = z
        .array(Question)
        .safeParse(await live.session.thread.getSetting({ key: QUESTION_KEY }))
      const last = asked.success ? asked.data.at(-1) : undefined
      const turn = { after: last === undefined ? undefined : questionId(conversationId, last.key) }
      for (const { n, event } of restart.said) {
        if (event.type === 'part') await keepPart(live, turn, event.part)
        const said = { id: eventId(restart.runId, n), event }
        for (const listener of live.listeners) listener(said)
      }
    } finally {
      await this.#release(conversationId, entry)
    }
  }

  /** The person's message that the turn in progress answers, or none: the stream tells that turn whole. */
  async inProgressAfter(conversationId: ConversationId): Promise<MessageId | undefined> {
    const live = await opened(this.#open.get(conversationId))
    return live?.turn?.ended === false ? live.turn.after : undefined
  }

  /** Stops the answer in progress; Mastra keeps the text so far (`agent_end` `aborted`). */
  async stop(conversationId: ConversationId): Promise<void> {
    const live = await opened(this.#open.get(conversationId))
    if (live === undefined) return
    const taken = await takeCards(live)
    live.session.abort()
    releaseCards(live, taken)
    const fields = { companyId: live.owner.companyId, conversationId }
    this.#log.info(fields, 'CONVERSATION_STOPPED')
  }

  /** Waits for every message and turn in progress, then ends the streams (code C62); the caller holds the deadline. */
  async drain(): Promise<void> {
    await Promise.all(this.#turns)
    this.#closing.abort()
  }

  /** Closes a conversation's session before its thread is deleted, aborting its turn. */
  async forget(conversationId: ConversationId): Promise<void> {
    const entry = this.#open.get(conversationId)
    if (entry !== undefined) await this.#close(conversationId, entry)
  }
}
