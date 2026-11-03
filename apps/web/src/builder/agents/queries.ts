import type { AgentDetail, AgentId, CompanyId, ProjectId } from '@conexus/hub-api'
import {
  activateAgentVersion,
  createAgentConversation,
  createConstrutorConversation,
  createTool,
  deleteAgent,
  getAgent,
  listAgentConversations,
  listAgents,
  listAgentVersions,
  listConstrutorConversations,
  listTools,
  publishAgent,
  saveAgentDraft,
} from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { hubMutation, hubQuery, hubQueryPrefix } from '../../platform/hub.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }

export function agentsQuery({ companyId, projectId }: Scope) {
  return hubQuery(listAgents, { params: { companyId }, query: { projectId } })
}

export function agentQuery(scope: Scope, agentId: AgentId) {
  return hubQuery(getAgent, { params: { ...scope, agentId } })
}

export function versionsQuery(scope: Scope, agentId: AgentId) {
  return hubQuery(listAgentVersions, { params: { ...scope, agentId } })
}

export function toolsQuery(scope: Scope) {
  return hubQuery(listTools, { params: scope })
}

export function agentConversationsQuery(scope: Scope, agentId: AgentId) {
  return hubQuery(listAgentConversations, { params: { ...scope, agentId } })
}

export function construtorConversationsQuery(scope: Scope) {
  return hubQuery(listConstrutorConversations, { params: scope })
}

/** Everything the area lists: the agents and the Construtor's conversations of a Projeto. */
export function agentsPrefix(scope: Scope) {
  return hubQueryPrefix(listAgents, { companyId: scope.companyId })
}

export const sendDraft = hubMutation(saveAgentDraft)
export const sendPublish = hubMutation(publishAgent)
export const sendActivation = hubMutation(activateAgentVersion)
export const sendDeletion = hubMutation(deleteAgent)
export const sendAgentConversation = hubMutation(createAgentConversation)
export const sendConstrutorConversation = hubMutation(createConstrutorConversation)
export const sendTool = hubMutation(createTool)

/** After a write that returns the agent: the page reads it as answered, and the versions and the list are read again. */
export async function settleAgent(queryClient: QueryClient, scope: Scope, agent: AgentDetail) {
  queryClient.setQueryData(agentQuery(scope, agent.id).queryKey, { agent })
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: versionsQuery(scope, agent.id).queryKey }),
    queryClient.invalidateQueries({ queryKey: agentsPrefix(scope) }),
  ])
}
