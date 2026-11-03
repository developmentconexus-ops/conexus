import type { AgentId, CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import {
  AGENTS_CONTROLLER,
  AgentId as AgentIdSchema,
  CONSTRUTOR_CONTROLLER,
  ConversationId as ConversationIdSchema,
} from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'
import { projectQuery } from '../../hub/projects/public.ts'
import { HubFailure, idOrNotFound, readOrNotFound } from '../../platform/hub.ts'
import { sessionReadQuery } from '../conversation/public.ts'
import {
  agentConversationsQuery,
  agentQuery,
  agentsQuery,
  construtorConversationsQuery,
} from './queries.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }

export const agentParams = {
  parse: (raw: { agentId: string }) => ({ agentId: idOrNotFound(AgentIdSchema, raw.agentId) }),
  stringify: (params: { agentId: AgentId }) => params,
}

/** The conversation an address names; the agent's own params come from the parent route. */
export const conversationParams = {
  parse: (raw: { conversationId: string }) => ({
    conversationId: idOrNotFound(ConversationIdSchema, raw.conversationId),
  }),
  stringify: (params: { conversationId: ConversationId }) => params,
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
      queryClient.query(agentsQuery(scope)),
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

/** A conversation with the Construtor: the person's own, in this Projeto. */
export async function loadConstrutorConversation(
  queryClient: QueryClient,
  scope: Scope,
  conversationId: ConversationId,
) {
  const [listed] = await readOrGone(
    Promise.all([
      queryClient.query(construtorConversationsQuery(scope)),
      queryClient.ensureQueryData(sessionReadQuery(conversationId, CONSTRUTOR_CONTROLLER)),
    ]),
  )
  if (!listed.conversations.some((one) => one.id === conversationId)) throw notFound()
}
