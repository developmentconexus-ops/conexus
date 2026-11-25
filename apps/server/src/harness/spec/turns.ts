import { randomUUID } from 'node:crypto'
import { ConversationId } from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { InputProcessor, OutputProcessor } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import { TurnKey } from '../../hub/connectors/public.ts'
import { Failure } from '../../platform/failure.ts'
import { controllerIn } from '../memory/public.ts'
import type { AccountTurn, QueueDeps } from '../model-accounts/public.ts'
import { setTurn, turnIn } from '../model-accounts/public.ts'
import type { Owner } from './kinds.ts'
import { turnOfOwner } from './memory.ts'

/** What a run's take answers (C21 on `kind`): its turn; no conversation of this controller; or a refusal with its reason. */
export type Taken =
  | Readonly<{ kind: 'TAKEN'; turn: AccountTurn }>
  | Readonly<{ kind: 'NONE' }>
  | Readonly<{ kind: 'REFUSED'; reason: string }>

/**
 * The one input processor that takes a run's turn (C26): at the input and, with `resumes`, at the
 * first step of a run Mastra resumes with no turn on its context. `NONE` aborts with `none`;
 * `REFUSED` with its reason.
 */
export function turnProcessor(options: {
  id: string
  none: string
  /** Whether a resumed run takes its turn at its first step: the session's and the Builder's do; a version's agent alone does not, as today. */
  resumes: boolean
  take: (requestContext: RequestContext) => Promise<Taken>
}): InputProcessor {
  async function taken(
    requestContext: RequestContext | undefined,
    abort: (reason: string) => never,
  ): Promise<void> {
    if (requestContext === undefined) return abort(options.none)
    const answer = await options.take(requestContext)
    switch (answer.kind) {
      case 'TAKEN':
        return setTurn(requestContext, answer.turn)
      case 'NONE':
        return abort(options.none)
      case 'REFUSED':
        return abort(answer.reason)
      default:
        return answer satisfies never
    }
  }
  const input: InputProcessor = {
    id: options.id,
    async processInput({ requestContext, messages, abort }) {
      await taken(requestContext, abort)
      return messages
    },
  }
  if (!options.resumes) return input
  return {
    ...input,
    // A run Mastra resumes (an answered card) reads no input: its first step takes the turn.
    async processInputStep({ requestContext, abort }) {
      if (requestContext === undefined || turnIn(requestContext) === undefined)
        await taken(requestContext, abort)
      return {}
    },
  }
}

/**
 * A controller's turns by session, and the one owner of their end (code C26): a run takes its turn
 * in the accounts' queue (step 11) as Mastra reads its input, by the controller's `take`, through
 * `turnProcessor`; a resumed one takes it at its first step. The turn lets go of its accounts when the
 * controller says the run ended (`agent_end`), for every end: done, failed, stopped by Parar or by
 * the Hub's end; a deleted session's run ends without one, so its deletion lets go too. `take` answers `undefined` for a run that is not one of its conversations; the turn it
 * answers is put on the run's context by the processor, once, so no `take` has to.
 */
export function sessionTurns(options: {
  id: string
  take: (requestContext: RequestContext) => Promise<AccountTurn | undefined>
}) {
  const held = new Map<ConversationId, { turn: AccountTurn; requestContext: RequestContext }>()
  const deleted = new WeakSet<RequestContext>()

  function letGo(sessionId: ConversationId): void {
    held.get(sessionId)?.turn.end()
    held.delete(sessionId)
  }

  async function take(requestContext: RequestContext): Promise<Taken> {
    const { sessionId } = controllerIn(requestContext)
    if (sessionId === undefined) return { kind: 'NONE' }
    const turn = await options.take(requestContext)
    if (turn === undefined) return { kind: 'NONE' }
    held.set(sessionId, { turn, requestContext })
    return { kind: 'TAKEN', turn }
  }

  // A deleted session's run still ends its stream after the abort, and Mastra's memory saves that
  // end, creating the thread again when the delete got there first. Its result belongs to a
  // conversation that no longer exists: a tripwire keeps the memory processors, which run after
  // this one, from saving it.
  const deletedRun: OutputProcessor = {
    id: `${options.id}-deleted`,
    async processOutputResult({ messages, requestContext, abort }) {
      if (requestContext !== undefined && deleted.has(requestContext)) abort('CONVERSATION_DELETED')
      return messages
    },
  }

  const processor = turnProcessor({
    id: options.id,
    none: 'CONVERSATION_NOT_FOUND',
    resumes: true,
    take,
  })

  function watch(controller: AgentController): void {
    controller.onSessionCreated((session) => {
      const sessionId = ConversationId.parse(session.identity.getId())
      session.subscribe((event) => {
        if (event.type !== 'agent_end') return
        letGo(sessionId)
      })
    })
    controller.onSessionDeleted((session) => {
      const sessionId = ConversationId.parse(session.identity.getId())
      const run = held.get(sessionId)
      if (run !== undefined) deleted.add(run.requestContext)
      letGo(sessionId)
    })
  }

  return { processor, deletedRun, watch }
}

/**
 * The key a controller's run counts the company door's calls by, kept on its request context under
 * the controller's own name: `start` puts a new one when the turn is taken, `of` reads it for a
 * connector call and fails when there is no turn.
 */
export function turnKeyOn(name: string) {
  return {
    start(requestContext: RequestContext): void {
      requestContext.set(name, TurnKey.parse(randomUUID()))
    },
    of(requestContext: RequestContext): TurnKey {
      const turn = TurnKey.safeParse(requestContext.get(name))
      if (!turn.success) {
        throw new Failure('INTERNAL_UNEXPECTED', {
          details: { reason: 'CONNECTOR_TOOL_WITHOUT_TURN' },
        })
      }
      return turn.data
    },
  }
}

/**
 * The `take` of a controller whose conversations are an owner's: the turn of the scope the run
 * belongs to, with a new `TurnKey` on its context; `undefined` for a run that is not one of them.
 */
export function takeOfScope(deps: {
  queue: QueueDeps
  scopeOf: (requestContext: RequestContext) => Promise<Owner | undefined>
  turnKey: ReturnType<typeof turnKeyOn>
}) {
  return async (requestContext: RequestContext): Promise<AccountTurn | undefined> => {
    const scope = await deps.scopeOf(requestContext)
    if (scope === undefined) return undefined
    const turn = await turnOfOwner(deps.queue, scope)
    deps.turnKey.start(requestContext)
    return turn
  }
}
