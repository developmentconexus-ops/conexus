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
  owner: Owner
  session: Session
  listeners: Set<Listener>
  answer: Message | undefined
  turn: Turn | undefined
  running: Promise<void> | undefined
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
 * The end of a turn: a failed one says why first, by how the queue ended it, never the provider's
 * text (security S41); `suspended` cannot happen, since the Builder has no tool that waits.
 */
function endTurn(live: Live, reason: 'complete' | 'aborted' | 'error' | 'suspended' | undefined) {
  if (reason === 'error') {
    const exhausted = live.turn?.outcome === 'exhausted'
    emit(live, { type: 'failure', code: exhausted ? 'MODEL_NO_ACCOUNT' : 'MODEL_CALL_FAILED' })
  }
  live.answer = undefined
  emit(live, {
    type: 'turnEnd',
    reason: reason === 'error' || reason === 'aborted' ? reason : 'complete',
  })
}

/**
 * The conversations open in this process (decision 0050): one controller session per conversation,
 * scoped by its id, so one person holds several at once; a session closes with its last stream
 * when no turn runs. Ownership was checked on the index before any call here.
 */
export class Sessions {
  readonly #builder: Builder
  readonly #log: FailureLog
  readonly #open = new Map<string, Promise<Live>>()
  // Ends every stream once the turns are drained, so the server's close does not wait on them.
  readonly #closing = new AbortController()

  constructor(deps: { builder: Builder; log: FailureLog }) {
    this.#builder = deps.builder
    this.#log = deps.log
  }

  #liveOf(owner: Owner, conversationId: string): Promise<Live> {
    const found = this.#open.get(conversationId)
    if (found !== undefined) return found
    const resourceId = memoryOwner(owner)
    const opening = this.#builder.controller
      .createSession({ resourceId, scope: conversationId, threadId: conversationId })
      .then((session) => {
        const live: Live = {
          owner,
          session,
          listeners: new Set(),
          answer: undefined,
          turn: undefined,
          running: undefined,
          unsubscribe: () => undefined,
        }
        live.unsubscribe = session.subscribe((event) => onEvent(live, event))
        return live
      })
    this.#open.set(conversationId, opening)
    opening.catch(() => this.#open.delete(conversationId))
    return opening
  }

  async #close(conversationId: string, live: Live): Promise<void> {
    if (this.#open.get(conversationId) === undefined) return
    this.#open.delete(conversationId)
    live.unsubscribe()
    const resourceId = memoryOwner(live.owner)
    await this.#builder.controller.deleteSession({ resourceId, scope: conversationId })
  }

  async #closeIfIdle(conversationId: string, live: Live): Promise<void> {
    if (live.listeners.size > 0 || live.running !== undefined) return
    await this.#close(conversationId, live)
  }

  /** Puts the conversation on a model, kept on its thread (`switch`), for its next turns. */
  async switchModel(owner: Owner, conversationId: string, model: string): Promise<void> {
    const live = await this.#liveOf(owner, conversationId)
    await live.session.model.switch(model)
    await this.#closeIfIdle(conversationId, live)
  }

  /**
   * Sends the person's message; the answer comes on the stream. The question is kept on the thread
   * first (Mastra saves a turn only at its end), and cleared when the turn has saved it.
   */
  async send(owner: Owner, conversationId: string, content: string): Promise<void> {
    const live = await this.#liveOf(owner, conversationId)
    const { thread } = live.session
    await thread.setSetting({ key: QUESTION_KEY, value: { content, at: new Date().toISOString() } })
    if (live.running !== undefined) {
      await live.session.sendMessage({ content })
      return
    }
    const turn = new Turn(owner)
    live.turn = turn
    live.running = live.session
      .sendMessage({ content, requestContext: turnContext(turn) })
      .then(() => thread.deleteSetting({ key: QUESTION_KEY }))
      .catch((cause: unknown) => {
        logFailure(this.#log, new Failure('INTERNAL_UNEXPECTED', { cause }))
        endTurn(live, 'error')
      })
      .finally(() => {
        live.running = undefined
        live.turn = undefined
        void this.#closeIfIdle(conversationId, live)
      })
  }

  /** The conversation's events: the answer in progress first, then each new one, until `signal`. */
  async *events(owner: Owner, conversationId: string, signal: AbortSignal) {
    const live = await this.#liveOf(owner, conversationId)
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
      await this.#closeIfIdle(conversationId, live)
    }
  }

  /** Stops the answer in progress; Mastra keeps the text so far (`agent_end` `aborted`). */
  async stop(conversationId: string): Promise<void> {
    const live = await this.#open.get(conversationId)?.catch(() => undefined)
    live?.session.abort()
  }

  /** Whether a turn of this conversation runs in this process now. */
  async running(conversationId: string): Promise<boolean> {
    const live = await this.#open.get(conversationId)?.catch(() => undefined)
    return live?.running !== undefined
  }

  /** Waits for every turn in progress, then ends the streams (code C62); the caller holds the deadline. */
  async drain(): Promise<void> {
    const opened = [...this.#open.values()].map((each) => each.catch(() => undefined))
    const lives = await Promise.all(opened)
    await Promise.all(lives.map((live) => live?.running))
    this.#closing.abort()
  }

  /** Closes a conversation's session before its thread is deleted, aborting its turn. */
  async forget(conversationId: string): Promise<void> {
    const live = await this.#open.get(conversationId)?.catch(() => undefined)
    if (live !== undefined) await this.#close(conversationId, live)
  }
}
