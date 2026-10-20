import type { ConversationId, EventId, ModelId } from '@conexus/hub-api'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import { Turn, turnContext } from '../model-accounts/public.ts'
import type { Builder } from './builder.ts'
import { memoryOwner } from './builder.ts'
import type { Listener, Live, Owner, Question, Said } from './live.ts'
import {
  beforeAgentEnd,
  endTurn,
  keepQuestion,
  onEvent,
  openTurn,
  questionId,
  resumeOf,
} from './live.ts'

/**
 * A conversation's place in this process: its session, opening or open, and how many holders use
 * it, each counted before its first wait, so the session closes only once none is left.
 */
type Entry = { live: Promise<Live>; holds: number }

type OfConversation = { owner: Owner; conversationId: ConversationId }

/**
 * The conversations open in this process (decision 0050): one controller session per conversation,
 * scoped by its id, so one person holds several at once; a session closes with its last stream
 * when no turn runs. Ownership was checked on the index before any call here.
 */
export class Sessions {
  readonly #builder: Builder
  readonly #log: FailureLog
  readonly #open = new Map<ConversationId, Entry>()
  // Every message from its arrival to the end of its run, for the drain to wait on.
  readonly #turns = new Set<Promise<void>>()
  // Ends every stream once the turns are drained, so the server's close does not wait on them.
  readonly #closing = new AbortController()

  constructor(deps: { builder: Builder; log: FailureLog }) {
    this.#builder = deps.builder
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
          ...{ turn: undefined, asked: new Set(), runs: new Map() },
          ...{ unclaimed: undefined, questions: [], kept: Promise.resolve() },
          unsubscribe: () => undefined,
        }
        const unsubscribe = session.subscribe((event) => onEvent(opened, event))
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
    // A session that never opened has nothing to close; its holders met the failure.
    // biome-ignore lint/plugin: the failure to open reached every holder of the entry; a session that never opened has nothing to close
    const live = await entry.live.catch(() => undefined)
    if (live === undefined) return
    live.unsubscribe()
    // A closed session ends no run, so its messages stop waiting here.
    for (const run of live.runs.values()) run.ended()
    live.runs.clear()
    const resourceId = memoryOwner(live.owner)
    await this.#builder.controller.deleteSession({ resourceId, scope: conversationId })
  }

  /** Puts the conversation on a model, kept on its thread (`switch`), for its next turns. */
  async switchModel(input: OfConversation & { model: ModelId }): Promise<void> {
    const entry = this.#hold(input)
    try {
      await (await entry.live).session.model.switch(input.model)
    } finally {
      await this.#release(input.conversationId, entry)
    }
  }

  /**
   * Keeps the person's question on the thread, then sends it on a turn of its own, whose answer
   * comes on the stream; resolves once the question is kept.
   */
  async send(input: OfConversation & { question: Question }): Promise<void> {
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
        (live) => this.#answer(live, input.question, turn),
        // The question was not kept: `send` throws it to the caller, and no turn starts.
        () => undefined,
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
   * Mastra decides where the message goes (`requireDelivery`): it wakes a run, which carries this
   * message's turn to the queue until that run's `agent_end`, or it joins the run in progress,
   * whose turn stays (criterion 12). `sendSignal` is `sendMessage`'s own call, which keeps that
   * decision to itself; the turn of each run is the one of the message that woke it, by Mastra's
   * run id, never the latest message's. A message Mastra could not route started no run: its
   * failure is the turn's end when no other run is in progress. A turn Mastra ran keeps its
   * failure after the message that opened it, the one it saves the turn after.
   */
  async #answer(live: Live, question: Question, turn: Turn): Promise<void> {
    const fields = { companyId: live.owner.companyId, conversationId: live.conversationId }
    this.#log.info(fields, 'CONVERSATION_TURN_STARTED')
    const id = questionId(live.conversationId, question.key)
    const opened = openTurn(live)
    try {
      const options = { requestContext: turnContext(turn), requireDelivery: true }
      const signal = { type: 'user', id, contents: question.content } as const
      const accepted = await live.session.sendSignal(signal, options).accepted
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
      if (live.unclaimed !== undefined && live.asked.size === 0) {
        const { reason } = live.unclaimed
        live.unclaimed = undefined
        endTurn(live, { reason, turn: undefined })
      }
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
    return this.#listen(live, { ...input, release })
  }

  #listen(
    live: Live,
    input: { signal: AbortSignal; lastEventId: EventId | null; release: () => Promise<void> },
  ) {
    const { signal, release } = input
    const waiting: Said[] = resumeOf(live, input.lastEventId)
    let wake: (() => void) | undefined
    const listener: Listener = (said) => {
      waiting.push(said)
      wake?.()
    }
    function stop() {
      wake?.()
    }
    live.listeners.add(listener)
    const ended = AbortSignal.any([signal, this.#closing.signal])
    ended.addEventListener('abort', stop, { once: true })
    async function* drained() {
      try {
        while (!ended.aborted) {
          const next = waiting.shift()
          if (next !== undefined) yield next
          else await new Promise<void>((resolve) => (wake = resolve))
          wake = undefined
        }
      } finally {
        ended.removeEventListener('abort', stop)
        live.listeners.delete(listener)
        await release()
      }
    }
    return drained()
  }

  /** Stops the answer in progress; Mastra keeps the text so far (`agent_end` `aborted`). */
  async stop(conversationId: ConversationId): Promise<void> {
    // A session that failed to open has no answer to stop; its holders met the failure.
    // biome-ignore lint/plugin: the failure to open reached every holder of the entry; a session that never opened has no answer to stop
    const live = await this.#open.get(conversationId)?.live.catch(() => undefined)
    if (live === undefined) return
    live.session.abort()
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
