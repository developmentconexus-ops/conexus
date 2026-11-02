import { createHash } from 'node:crypto'
import type { AutomationId, ConnectionId, Effort, ModelId, ProjectId } from '@conexus/hub-api'
import {
  AutomationId as AutomationIdSchema,
  ConversationId,
  ModelId as ModelIdSchema,
} from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import { z } from 'zod'
import type { Connectors, SessionScope } from '../../hub/connectors/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import { conversationStart, effortsOf } from '../model-accounts/public.ts'
import type { ChosenConnections } from './chosen.ts'
import type { Owner } from './context.ts'
import { assistantOwner, SESSION_MARK } from './context.ts'
import type { assistantMemory } from './memory.ts'
import type { AssistantProjects } from './ports.ts'

type Place = SessionScope['place']

/** The place a request names: the Início, or one Projeto. */
export function placeOf(projectId: ProjectId | undefined | null): Place {
  return projectId == null ? { kind: 'COMPANY' } : { kind: 'PROJECT', projectId }
}

export type OpenDeps = {
  connectors: Pick<Connectors['assistant'], 'connections'>
  queue: QueueDeps
  controller: AgentController
  memory: ReturnType<typeof assistantMemory>
  chosen: ChosenConnections
}

/**
 * The person may ask the Assistant in the company now (`askAssistant`), and the Projeto named is
 * live; else the same `NOT_FOUND` (security S10).
 */
export async function admitted(
  deps: {
    database: Database
    identity: IdentityPorts
    projects: Pick<AssistantProjects, 'liveProjectOf'>
  },
  owner: Owner,
  place: Place,
): Promise<void> {
  await deps.database.read({ kind: 'COMPANY', ...owner }, async (tx) => {
    await deps.identity.admitMember({ tx, ...owner, action: 'askAssistant' })
    if (place.kind === 'COMPANY') return
    const live = await deps.projects.liveProjectOf(tx, {
      companyId: owner.companyId,
      projectId: place.projectId,
    })
    if (live === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'PROJECT' } })
  })
}

/** The automation whose run opened a conversation, as its marks keep it. */
export type ConversationAutomation = { automationId: AutomationId; name: string }

const AutomationMarks = z
  .object({
    [SESSION_MARK.automation]: AutomationIdSchema,
    [SESSION_MARK.automationName]: z.string(),
  })
  .transform((marks) => ({
    automationId: marks[SESSION_MARK.automation],
    name: marks[SESSION_MARK.automationName],
  }))

/** The automation a thread's marks name, or `null` for a conversation a person opened. */
export function automationOf(metadata: Record<string, unknown> | undefined) {
  if (metadata?.[SESSION_MARK.automation] === undefined) return null
  return AutomationMarks.parse(metadata)
}

/**
 * One conversation id per company, person and key, so a repeat of the same attempt, or of the same
 * automation run, finds the same thread (code C37).
 */
export function conversationIdOf(owner: Owner, key: string): ConversationId {
  const hex = createHash('sha256')
    .update(`assistant:${owner.companyId}:${owner.personId}:${key}`)
    .digest('hex')
  const variant = ((Number.parseInt(hex.slice(16, 17), 16) & 0x3) | 0x8).toString(16)
  return ConversationId.parse(
    `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`,
  )
}

/** Of the connections asked, only those the place offers now, in the place's order. */
export async function offeredOnly(
  deps: Pick<OpenDeps, 'connectors'>,
  scope: SessionScope,
  asked: readonly ConnectionId[],
): Promise<ConnectionId[]> {
  const wanted = new Set(asked)
  const offered = await deps.connectors.connections({ ...scope, chosen: [] })
  return offered.flatMap((each) => (wanted.has(each.connectionId) ? [each.connectionId] : []))
}

/**
 * Opens a conversation of the Assistant, or finds the one its id names (code C37). `createSession`
 * is get-or-create on the id and stamps the thread's marks; the model is set only if the thread
 * holds none, so a repeat after a cut finishes the first attempt. The caller admits the person and
 * the place first.
 */
export async function openConversation(
  deps: OpenDeps,
  input: {
    owner: Owner
    place: Place
    id: ConversationId
    connections: readonly ConnectionId[]
    model?: ModelId | undefined
    effort?: Effort | undefined
    automation?: ConversationAutomation
  },
) {
  const { owner, place, id } = input
  const resourceId = assistantOwner(owner)
  const earlier = await deps.memory.getThreadById({ threadId: id, resourceId })
  const start = await conversationStart(deps.queue, owner, input.model)
  const effort = input.effort ?? start.effort
  if (!effortsOf(start.model).includes(effort)) throw new Failure('EFFORT_UNSUPPORTED')
  const chosen = await offeredOnly(deps, { ...owner, place, chosen: [] }, input.connections)
  const projectId = place.kind === 'PROJECT' ? place.projectId : undefined
  const made = await deps.chosen.keep(owner, { conversationId: id, projectId, connections: chosen })
  const { automation } = input
  const tags = {
    [SESSION_MARK.company]: owner.companyId,
    [SESSION_MARK.person]: owner.personId,
    ...(projectId === undefined ? {} : { [SESSION_MARK.project]: projectId }),
    ...(automation === undefined
      ? {}
      : {
          [SESSION_MARK.automation]: automation.automationId,
          [SESSION_MARK.automationName]: automation.name,
        }),
  }
  const session = await deps.controller.createSession({ id, resourceId, threadId: id, tags })
  const kept = ModelIdSchema.optional().parse(earlier?.metadata?.currentModelId)
  if (kept === undefined) await session.model.switch(start.model, { thinkingLevel: effort })
  // The attempt that kept the choice made the conversation: a repeat, or a race on the key, did
  // not.
  return { made, session, model: kept ?? start.model }
}

/**
 * Whether a conversation opened for one question already holds a message: Mastra keeps the
 * question (role `signal`, sent to the session's run) until the model's first step ends, so any
 * message means it was asked.
 */
export async function asked(
  memory: OpenDeps['memory'],
  owner: Owner,
  conversationId: ConversationId,
): Promise<boolean> {
  const { messages } = await memory.recall({
    threadId: conversationId,
    resourceId: assistantOwner(owner),
    perPage: 1,
  })
  return messages.length > 0
}
