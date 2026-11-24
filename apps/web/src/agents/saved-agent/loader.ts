import type { AgentId, CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { AGENTS_CONTROLLER, AgentId as AgentIdSchema } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'
import { sessionReadQuery } from '../../harness/room/public.ts'
import { projectQuery } from '../../hub/projects/public.ts'
import { HubFailure, idOrNotFound, readOrNotFound } from '../../platform/hub.ts'
import { agentConversationsQuery, agentQuery, agentsQuery } from './queries.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }

export const agentParams = {
  parse: (raw: { agentId: string }) => ({ agentId: idOrNotFound(AgentIdSchema, raw.agentId) }),
  stringify: (params: { agentId: AgentId }) => params,
}

/** An agent the Hub does not find at this address is a page not found, as a Projeto is. */
async function readOrGone<T>(read: Promise<T>): Promise<T> {
  try {
    return await readOrNotFound(read)
  } catch (error) {
    if (error instanceof HubFailure && error.code === 'AGENT_NOT_FOUND') throw notFound()
    throw error
  }
}

/**
 * What the area reads before it opens: the Projeto (a deleted one is not found) and its agents. A
 * member's read is not found (S10). It reads fresh: a loader that decides existence never takes it
 * from data a write marked stale (web W12).
 */
export function loadArea(queryClient: QueryClient, scope: Scope) {
  return readOrGone(
    Promise.all([
      queryClient.query(projectQuery(scope.companyId, scope.projectId)),
      queryClient.query(agentsQuery(scope.companyId, scope.projectId)),
    ]),
  )
}

/** The agent of an address, read fresh; one that is not this Projeto's or was deleted is not found. */
export function loadAgent(queryClient: QueryClient, scope: Scope, agentId: AgentId) {
  return readOrGone(
    Promise.all([
      queryClient.query(projectQuery(scope.companyId, scope.projectId)),
      queryClient.query(agentQuery(scope, agentId)),
    ]),
  )
}

/** A conversation with an agent: the person's own, with this agent. */
export async function loadAgentConversation(
  queryClient: QueryClient,
  scope: Scope,
  ids: { agentId: AgentId; conversationId: ConversationId },
) {
  const [, listed] = await readOrGone(
    Promise.all([
      loadAgent(queryClient, scope, ids.agentId),
      queryClient.query(agentConversationsQuery(scope, ids.agentId)),
      queryClient.ensureQueryData(sessionReadQuery(ids.conversationId, AGENTS_CONTROLLER)),
    ]),
  )
  if (!listed.conversations.some((one) => one.id === ids.conversationId)) throw notFound()
}

/**
 * What the Início's Agentes page reads before it opens: the company's agents, or one Projeto's. A
 * member's read is not found (S10); any other failure stays on the read, and the page opens with it
 * where the list goes, under the title, the filter and Novo agente (issue 705).
 */
export async function loadAgents(
  queryClient: QueryClient,
  place: { companyId: CompanyId; projectId?: ProjectId },
) {
  const agents = agentsQuery(place.companyId, place.projectId)
  await queryClient.prefetchQuery(agents)
  const { error } = queryClient.getQueryState(agents.queryKey) ?? {}
  if (error instanceof HubFailure && error.code === 'NOT_FOUND') throw notFound()
}
