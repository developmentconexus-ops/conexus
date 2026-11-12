import type {
  AutomationId,
  ConnectionId,
  ConversationId,
  Effort,
  ModelId,
  ProjectId,
} from '@conexus/hub-api'
import { AutomationId as AutomationIdSchema } from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import { z } from 'zod'
import type { Connectors, SessionScope } from '../../hub/connectors/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { oncePerRun, openSession, resourceOf } from '../controller-kit/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import type { ChosenConnections } from './chosen.ts'
import type { Owner } from './context.ts'
import { runConversation, SESSION_MARK } from './context.ts'
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
 * The person may take `action` in the company now (ask the Assistant, or create automations), and
 * the Projeto named is live; else the same `NOT_FOUND` (security S10).
 */
export async function admitted(
  deps: {
    database: Database
    identity: IdentityPorts
    projects: Pick<AssistantProjects, 'liveProjectOf'>
  },
  owner: Owner,
  place: Place,
  action: 'askAssistant' | 'manageAutomations',
): Promise<void> {
  await deps.database.read({ kind: 'COMPANY', ...owner }, async (tx) => {
    await deps.identity.admitMember({ tx, ...owner, action })
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

/** The marks a conversation's thread is stamped with (`createSession({ tags })`), one rule for opening and for resuming. */
export function marksOf(
  owner: Owner,
  opened: { projectId?: ProjectId | undefined; automation?: ConversationAutomation | undefined },
): Record<string, string> {
  const { projectId, automation } = opened
  return {
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
}

/**
 * Opens a conversation of the Assistant, or finds the one its id names (`openSession`): its choice
 * kept in the Hub before the thread, the thread stamped with its marks. The caller admits the
 * person and the place first.
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
  const { owner, place, id, automation } = input
  const projectId = place.kind === 'PROJECT' ? place.projectId : undefined
  const tags = marksOf(owner, { projectId, automation })
  return openSession(deps, {
    ...{ kind: 'assistant', owner, id, tags, model: input.model, effort: input.effort },
    keep: async () => {
      const chosen = await offeredOnly(deps, { ...owner, place, chosen: [] }, input.connections)
      return deps.chosen.keep(owner, { conversationId: id, projectId, connections: chosen })
    },
  })
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
    resourceId: resourceOf('assistant', owner),
    perPage: 1,
  })
  return messages.length > 0
}

/**
 * Whether an automation's run opened the run's conversation, from its thread's marks, read once per
 * run: nobody sees a button there, so no hand-off to the Builder is offered.
 */
export function automationRunFor(memory: ReturnType<typeof assistantMemory>) {
  return oncePerRun(async (requestContext) => {
    const run = runConversation(requestContext)
    if (run === undefined) return false
    const thread = await memory.getThreadById({
      threadId: run.sessionId,
      resourceId: run.resourceId,
    })
    return automationOf(thread?.metadata) !== null
  })
}
