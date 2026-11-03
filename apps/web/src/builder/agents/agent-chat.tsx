import type { AgentDetail, CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { AGENTS_CONTROLLER } from '@conexus/hub-api'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useConnectorCatalog } from '../assistant/public.ts'
import { agentRoom, Chat, RoomContext, START_NO_ACCOUNT } from '../conversation/public.ts'
import { agentConversationsQuery, agentQuery } from './queries.ts'
import { askAgent, TEST_BANNER } from './text.ts'

/** A conversation with an agent, published or the test one with the draft: the conversation of the 24.1 over the `agents` controller (web W31). */
export function AgentChat(props: {
  companyId: CompanyId
  projectId: ProjectId
  agentId: AgentDetail['id']
  conversationId: ConversationId
}) {
  const { companyId, projectId, agentId, conversationId } = props
  const scope = { companyId, projectId }
  const queryClient = useQueryClient()
  const { words } = useConnectorCatalog(companyId)
  const { agent } = useSuspenseQuery(agentQuery(scope, agentId)).data
  const { conversations } = useSuspenseQuery(agentConversationsQuery(scope, agentId)).data
  const draft = conversations.find((one) => one.id === conversationId)?.draft === true
  const listKey = agentConversationsQuery(scope, agentId).queryKey
  const room = useMemo(
    () => ({
      ...agentRoom(agent.name, words),
      toolDescription: (slug: string) =>
        agent.tools.find((one) => one.slug === slug)?.version.description,
    }),
    [agent.name, agent.tools, words],
  )
  return (
    <RoomContext.Provider value={room}>
      <div key={conversationId} className="flex h-full min-h-0 flex-col bg-surface">
        {draft && (
          <p className="border-b border-line bg-surface-3 px-md py-xs text-label text-text-2">
            {TEST_BANNER}
          </p>
        )}
        <Chat
          companyId={companyId}
          conversationId={conversationId}
          place={{ controller: AGENTS_CONTROLLER }}
          conversationKey={listKey}
          onGone={() => void queryClient.invalidateQueries({ queryKey: listKey })}
          empty={`Converse com ${agent.name}.`}
          placeholder={askAgent(agent.name)}
          noAccount={START_NO_ACCOUNT}
        />
      </div>
    </RoomContext.Provider>
  )
}
