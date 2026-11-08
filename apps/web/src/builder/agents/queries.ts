import type { AgentDetail, AgentId, CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
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
  listOpenWrites,
  listTools,
  publishAgent,
  saveAgentDraft,
  setConstrutorModel,
} from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { hubMutation, hubQuery, hubQueryPrefix } from '../../platform/hub.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }

/** The Projeto's agents; without a Projeto, those of every live Projeto of the company (Início). */
export function agentsQuery(companyId: CompanyId, projectId: ProjectId | undefined) {
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

/** The agent's sends in the conversation whose end is not known (step 24.5), for the warning on a card. */
export function openWritesQuery(scope: Scope, agentId: AgentId, conversationId: ConversationId) {
  return hubQuery(listOpenWrites, { params: { ...scope, agentId, conversationId } })
}

export function construtorConversationsQuery(scope: Scope) {
  return hubQuery(listConstrutorConversations, { params: scope })
}

/** Every read of the company's agent lists, whichever Projeto it names (the lists are keyed by company and Projeto). */
export function agentsPrefix(scope: Pick<Scope, 'companyId'>) {
  return hubQueryPrefix(listAgents, { companyId: scope.companyId })
}

export const sendDraft = hubMutation(saveAgentDraft)
export const sendPublish = hubMutation(publishAgent)
export const sendActivation = hubMutation(activateAgentVersion)
export const sendDeletion = hubMutation(deleteAgent)
export const sendAgentConversation = hubMutation(createAgentConversation)
export const sendConstrutorConversation = hubMutation(createConstrutorConversation)
export const sendConstrutorModel = hubMutation(setConstrutorModel)
export const sendTool = hubMutation(createTool)

/** After a write that returns the agent: the page reads it as answered, and the versions and the list are read again. */
export async function settleAgent(queryClient: QueryClient, scope: Scope, agent: AgentDetail) {
  queryClient.setQueryData(agentQuery(scope, agent.id).queryKey, { agent })
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: versionsQuery(scope, agent.id).queryKey }),
    queryClient.invalidateQueries({ queryKey: agentsPrefix(scope) }),
  ])
}
