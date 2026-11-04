import { createHash } from 'node:crypto'
import type { Effort } from '@conexus/hub-api'
import { ConversationId, ModelId } from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { Memory } from '@mastra/memory'
import { Failure } from '../../platform/failure.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import { conversationModel, conversationStart, effortsOf } from '../model-accounts/public.ts'
import type { ControllerKind, Owner } from './kinds.ts'
import { resourceOf } from './kinds.ts'

/**
 * A conversation's id by its attempt (code C37): one per controller, company, person and key, so a
 * repeat of the same attempt, or of the same automation run, finds the same thread. The sha256 in
 * the shape of a version 8 uuid; for the Assistant, the id it always had.
 */
export function attemptIdOf(kind: ControllerKind, owner: Owner, key: string): ConversationId {
  const hex = createHash('sha256')
    .update(`${kind}:${owner.companyId}:${owner.personId}:${key}`)
    .digest('hex')
  const variant = ((Number.parseInt(hex.slice(16, 17), 16) & 0x3) | 0x8).toString(16)
  return ConversationId.parse(
    `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`,
  )
}

/**
 * What the first attempt kept in the Hub, before the thread (data D17): made now, or found, with
 * whether it asked the same and the id of the row that already existed.
 */
export type Kept = { made: true } | { made: false; same: boolean; id: ConversationId }

type Session = Awaited<ReturnType<AgentController['createSession']>>

/**
 * Opens a conversation, or finds the one its attempt made (code C37). A thread already on a model
 * runs nothing again, so a late repeat answers its model even if the start changed since. Else the
 * start and its effort are checked before the Hub's row is kept; `createSession` finds or creates
 * the thread by the row's id and stamps its marks, and the model is set only on a thread that holds
 * none, so a repeat after a cut finishes the first attempt.
 */
export async function openSession(
  deps: { controller: AgentController; memory: Memory; queue: QueueDeps },
  input: {
    kind: ControllerKind
    owner: Owner
    id: ConversationId
    tags?: Record<string, string>
    keep: () => Promise<Kept>
    model?: ModelId | undefined
    effort?: Effort | undefined
  },
): Promise<{ made: boolean; session: Session; model: ModelId }> {
  const resourceId = resourceOf(input.kind, input.owner)
  async function modelOn(threadId: ConversationId) {
    const thread = await deps.memory.getThreadById({ threadId, resourceId })
    return ModelId.optional().parse(thread?.metadata?.currentModelId)
  }
  async function opened(): Promise<{ made: boolean; id: ConversationId }> {
    const kept = await input.keep()
    if (kept.made) return { made: true, id: input.id }
    if (!kept.same) throw new Failure('IDEMPOTENCY_CONFLICT')
    return { made: false, id: kept.id }
  }
  function sessionOf(id: ConversationId): Promise<Session> {
    const tags = input.tags === undefined ? {} : { tags: input.tags }
    return deps.controller.createSession({ id, resourceId, threadId: id, ...tags })
  }

  const repeated = await modelOn(input.id)
  if (repeated !== undefined) {
    const { made, id } = await opened()
    return { made, session: await sessionOf(id), model: repeated }
  }
  const start = await conversationStart(deps.queue, input.owner, input.model)
  const effort = input.effort ?? start.effort
  if (!effortsOf(start.model).includes(effort)) throw new Failure('EFFORT_UNSUPPORTED')
  const { made, id } = await opened()
  const kept = made ? undefined : await modelOn(id)
  const session = await sessionOf(id)
  if (kept === undefined) await session.model.switch(start.model, { thinkingLevel: effort })
  return { made, session, model: kept ?? start.model }
}

/**
 * Puts a conversation on the model and effort the person chose, kept together on its thread
 * (`switch`), for its next turns; the Builder's, the Assistant's and the Construtor's routes of
 * `…/model` all end here. The model needs an account the person may use and the effort one the model
 * offers, or nothing changes. `createSession` finds the session, or recovers it with the marks its
 * creation stamped (`tags`), so one is never born without them.
 */
export async function changeModel(
  deps: { controller: AgentController; queue: QueueDeps },
  input: {
    kind: ControllerKind
    owner: Owner
    id: ConversationId
    tags?: Record<string, string>
    choice: { model: ModelId; effort: Effort }
  },
): Promise<{ model: ModelId; effort: Effort }> {
  const { kind, owner, id, choice } = input
  const model = await conversationModel(deps.queue, owner, choice.model)
  if (!effortsOf(model).includes(choice.effort)) throw new Failure('EFFORT_UNSUPPORTED')
  const tags = input.tags === undefined ? {} : { tags: input.tags }
  const session = await deps.controller.createSession({
    id,
    resourceId: resourceOf(kind, owner),
    threadId: id,
    ...tags,
  })
  await session.model.switch(model, { thinkingLevel: choice.effort })
  return { model, effort: choice.effort }
}
