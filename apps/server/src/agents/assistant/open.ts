import type {
  AutomationId,
  ConnectionId,
  ConversationId,
  Effort,
  ModelId,
  ProjectId,
} from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { QueueDeps } from '../../harness/model-accounts/public.ts'
import type { Owner } from '../../harness/spec/public.ts'
import {
  markSchema,
  marksOf,
  openSession,
  RUN_MARKS,
  resourceOf,
} from '../../harness/spec/public.ts'
import type { CompanyProjects } from '../../harness/tools/public.ts'
import type { Access, Place } from '../../hub/access/public.ts'
import { principalFor } from '../../hub/access/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { ChosenConnections } from './chosen.ts'
import type { assistantMemory } from './memory.ts'

/** The place a request names: the Início, or one Projeto. */
export function placeOf(projectId: ProjectId | undefined | null): Place {
  return projectId == null ? { kind: 'COMPANY' } : { kind: 'PROJECT', projectId }
}

export type OpenDeps = {
  access: Pick<Access, 'viewOf'>
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
    projects: Pick<CompanyProjects, 'liveProjectOf'>
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

/** The automation a thread's marks name, or `null` for a conversation a person opened. */
export function automationOf(metadata: Record<string, unknown> | undefined) {
  if (metadata?.[RUN_MARKS.assistant.automation] === undefined) return null
  return markSchema('assistant').parse(metadata).automation ?? null
}

/**
 * The connections the place offers the owner now, by the access door's view (issue 1147): a
 * connection the role uses nothing of is not offered.
 */
export async function offeredBy(access: Pick<Access, 'viewOf'>, owner: Owner, place: Place) {
  const view = await access.viewOf(
    principalFor({ consumer: 'assistant', ...owner, place, choice: { kind: 'ANY' } }),
  )
  return view.list('system')
}

/** Each connection the place offers the owner now, with whether `chosen` holds it. */
export async function offeredWith(
  access: Pick<Access, 'viewOf'>,
  owner: Owner,
  place: Place,
  chosen: readonly ConnectionId[],
) {
  const held = new Set(chosen)
  const offered = await offeredBy(access, owner, place)
  return offered.map(({ connection, connector, name }) => ({
    ...{ connectionId: connection, connector, name },
    chosen: held.has(connection),
  }))
}

/** Of the connections asked, only those the place offers the owner now, in the place's order. */
export async function offeredAmong(
  access: Pick<Access, 'viewOf'>,
  owner: Owner,
  place: Place,
  asked: readonly ConnectionId[],
): Promise<ConnectionId[]> {
  const wanted = new Set(asked)
  const offered = await offeredBy(access, owner, place)
  return offered.flatMap(({ connection }) => (wanted.has(connection) ? [connection] : []))
}

/** The marks a conversation's thread is stamped with (`createSession({ tags })`), one rule for opening and for resuming. */
export function assistantMarks(
  owner: Owner,
  opened: { projectId?: ProjectId | undefined; automation?: ConversationAutomation | undefined },
): Record<string, string> {
  return marksOf('assistant', { ...owner, ...opened })
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
  const tags = assistantMarks(owner, { projectId, automation })
  return openSession(deps, {
    ...{ kind: 'assistant', owner, id, tags, model: input.model, effort: input.effort },
    keep: async () => {
      const chosen = await offeredAmong(deps.access, owner, place, input.connections)
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
