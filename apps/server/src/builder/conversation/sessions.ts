import type { CompanyId, ConversationEvent, Message, PersonId } from '@conexus/hub-api'
import type { AgentControllerEvent, Session } from '@mastra/core/agent-controller'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import { Turn, turnContext } from '../model-accounts/public.ts'
import type { Builder } from './builder.ts'
import { memoryOwner } from './builder.ts'
import { partOf } from './parts.ts'

/** The person's question, kept on the thread before its turn runs, so a crash does not lose it. */
export const QUESTION_KEY = 'conexus.question'

export type Owner = { companyId: CompanyId; personId: PersonId }
type Listener = (event: ConversationEvent) => void

/** A conversation open in this process: its controller session and the answer in progress. */
type Live = {
  conversationId: string
  owner: Owner
  log: FailureLog
  session: Session
  listeners: Set<Listener>
  answer: Message | undefined
  // The turn of the run in progress, until its end.
  turn: Turn | undefined
  unsubscribe: () => void
}

/**
 * A conversation's place in this process: its session, opening or open, and how many holders use
 * it, each counted before its first wait, so the session closes only once none is left.
 */
type Entry = { live: Promise<Live>; holds: number }

function emit(live: Live, event: ConversationEvent): void {
  for (const listener of live.listeners) listener(event)
}

function appendText(answer: Message, delta: string): void {
  const last = answer.parts.at(-1)
  if (last?.type === 'text') last.text += delta
  else answer.parts.push({ type: 'text', text: delta })
}

/** The controller's events as the person's: text, pages read, notices, the title, the turn's end. */
function onEvent(live: Live, event: AgentControllerEvent): void {
  if (event.type === 'message_start' && event.message.role === 'assistant') {
    const notices = live.answer?.parts.filter((part) => part.type === 'notice') ?? []
    const createdAt = new Date(event.message.createdAt).toISOString()
    live.answer = { id: event.message.id, role: 'builder', parts: notices, createdAt }
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
  } else if (event.type === 'info') {
    const now = new Date().toISOString()
    live.answer ??= { id: `notice-${now}`, role: 'builder', parts: [], createdAt: now }
    live.answer.parts.push({ type: 'notice', text: event.message })
    emit(live, { type: 'notice', text: event.message })
  } else if (event.type === 'thread_title_updated') {
    emit(live, { type: 'title', title: event.title })
  } else if (event.type === 'agent_end') {
    endTurn(live, event.reason)
  }
}

/**
 * The end of a turn, said once: a failed one says why first, by how the queue ended it, never the
 * provider's text (security S41); `suspended` cannot happen, since the Builder has no tool that waits.
 */
function endTurn(
  live: Live,
  reason: 'complete' | 'aborted' | 'error' | 'suspended' | undefined,
  unexpected?: 'INTERNAL_UNEXPECTED',
) {
  const ended = reason === 'error' || reason === 'aborted' ? reason : 'complete'
  if (ended === 'error') {
    const exhausted = live.turn?.outcome === 'exhausted'
    const code = unexpected ?? (exhausted ? 'MODEL_NO_ACCOUNT' : 'MODEL_CALL_FAILED')
    emit(live, { type: 'failure', code })
  }
  live.turn?.end()
  live.turn = undefined
  live.answer = undefined
  const { conversationId, owner } = live
  const fields = { companyId: owner.companyId, conversationId, reason: ended }
  live.log.info(fields, 'CONVERSATION_TURN_ENDED')
  emit(live, { type: 'turnEnd', reason: ended })
}

/**
 * The conversations open in this process (decision 0050): one controller session per conversation,
 * scoped by its id, so one person holds several at once; a session closes with its last stream
 * when no turn runs. Ownership was checked on the index before any call here.
 */
export class Sessions {
  readonly #builder: Builder
  readonly #log: FailureLog
  readonly #open = new Map<string, Entry>()
  // Every message from its arrival to the end of its run, for the drain to wait on.
  readonly #turns = new Set<Promise<void>>()
  // Ends every stream once the turns are drained, so the server's close does not wait on them.
  readonly #closing = new AbortController()

  constructor(deps: { builder: Builder; log: FailureLog }) {
    this.#builder = deps.builder
    this.#log = deps.log
  }

  /** The conversation's entry, opened if needed and held, before any wait (`#release`). */
  #hold(owner: Owner, conversationId: string): Entry {
    const found = this.#open.get(conversationId)
    if (found !== undefined) {
      found.holds += 1
      return found
    }
    const resourceId = memoryOwner(owner)
    const live = this.#builder.controller
      .createSession({ resourceId, scope: conversationId, threadId: conversationId })
      .then((session) => {
        const listeners = new Set<Listener>()
        const opened: Live = {
          ...{ conversationId, owner, log: this.#log, session, listeners },
          ...{ answer: undefined, turn: undefined, unsubscribe: () => undefined },
        }
        opened.unsubscribe = session.subscribe((event) => onEvent(opened, event))
        return opened
      })
    const entry: Entry = { live, holds: 1 }
    this.#open.set(conversationId, entry)
    live.catch(() => this.#close(conversationId, entry))
    return entry
  }

  async #release(conversationId: string, entry: Entry): Promise<void> {
    entry.holds -= 1
    if (entry.holds === 0) await this.#close(conversationId, entry)
  }

  /** Closes this entry's session, if it is still the conversation's: a newer one stays. */
  async #close(conversationId: string, entry: Entry): Promise<void> {
    if (this.#open.get(conversationId) !== entry) return
    this.#open.delete(conversationId)
    const live = await entry.live.catch(() => undefined)
    if (live === undefined) return
    live.unsubscribe()
    const resourceId = memoryOwner(live.owner)
    await this.#builder.controller.deleteSession({ resourceId, scope: conversationId })
  }

  /** Puts the conversation on a model, kept on its thread (`switch`), for its next turns. */
  async switchModel(owner: Owner, conversationId: string, model: string): Promise<void> {
    const entry = this.#hold(owner, conversationId)
    try {
      await (await entry.live).session.model.switch(model)
    } finally {
      await this.#release(conversationId, entry)
    }
  }

  /**
   * Keeps the person's question on the thread (Mastra saves a turn only at its end), then sends it
   * on a turn of its own, whose answer comes on the stream; resolves once the question is kept.
   */
  async send(owner: Owner, conversationId: string, content: string): Promise<void> {
    const entry = this.#hold(owner, conversationId)
    const kept = entry.live.then(async (live) => {
      const value = { content, at: new Date().toISOString() }
      await live.session.thread.setSetting({ key: QUESTION_KEY, value })
      return live
    })
    const turn: Promise<void> = kept
      .then(
        (live) => this.#answer(live, content),
        () => undefined,
      )
      .then(() => this.#release(conversationId, entry))
      .catch((cause: unknown) =>
        logFailure(this.#log, new Failure('INTERNAL_UNEXPECTED', { cause })),
      )
      .finally(() => this.#turns.delete(turn))
    this.#turns.add(turn)
    await kept
  }

  /**
   * Mastra injects a message into the run that streams now, which keeps that run's turn; otherwise
   * the message starts a run on its own turn. Either way the message carries a turn, so the queue
   * always knows whose it is (criterion 12).
   */
  async #answer(live: Live, content: string): Promise<void> {
    const turn = new Turn(live.owner)
    if (!live.session.stream.isActive()) live.turn = turn
    const fields = { companyId: live.owner.companyId, conversationId: live.conversationId }
    this.#log.info(fields, 'CONVERSATION_TURN_STARTED')
    try {
      await live.session.sendMessage({ content, requestContext: turnContext(turn) })
    } catch (cause) {
      logFailure(this.#log, new Failure('INTERNAL_UNEXPECTED', { cause }))
      // A run whose `agent_end` came has ended its turn already.
      if (live.turn === turn) endTurn(live, 'error', 'INTERNAL_UNEXPECTED')
    } finally {
      // Mastra's `sendMessage` settles once the run it started is over; `end` lets go only once.
      turn.end()
    }
  }

  /** The conversation's events: the answer in progress first, then each new one, until `signal`. */
  async *events(owner: Owner, conversationId: string, signal: AbortSignal) {
    const entry = this.#hold(owner, conversationId)
    try {
      yield* this.#listen(await entry.live, signal)
    } finally {
      await this.#release(conversationId, entry)
    }
  }

  async *#listen(live: Live, signal: AbortSignal) {
    const waiting: ConversationEvent[] = []
    let wake: (() => void) | undefined
    function listener(event: ConversationEvent) {
      waiting.push(event)
      wake?.()
    }
    function stop() {
      wake?.()
    }
    if (live.answer !== undefined) {
      waiting.push({ type: 'turn', message: structuredClone(live.answer) })
    }
    live.listeners.add(listener)
    const ended = AbortSignal.any([signal, this.#closing.signal])
    ended.addEventListener('abort', stop, { once: true })
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
    }
  }

  /** Stops the answer in progress; Mastra keeps the text so far (`agent_end` `aborted`). */
  async stop(conversationId: string): Promise<void> {
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
  async forget(conversationId: string): Promise<void> {
    const entry = this.#open.get(conversationId)
    if (entry !== undefined) await this.#close(conversationId, entry)
  }
}
