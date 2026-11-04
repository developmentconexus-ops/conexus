import type { AgentId, CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { CONSTRUTOR_CONTROLLER } from '@conexus/hub-api'
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { FixedProjectChip, useConnectorCatalog } from '../assistant/public.ts'
import {
  agentRoom,
  Beside,
  Chat,
  ComposerModelName,
  RoomContext,
  START_NO_ACCOUNT,
} from '../conversation/public.ts'
import { DraftPanel } from './draft-panel.tsx'
import { agentQuery, construtorConversationsQuery, toolsQuery } from './queries.ts'
import {
  CONSTRUTOR_FIRST,
  CONSTRUTOR_NAME,
  CONSTRUTOR_PLACEHOLDER,
  DRAFT_PANEL,
  titleOf,
} from './text.ts'

/** A conversation with the Construtor: the conversation of the 24.1 over the `construtor` controller (criterion 26). */
export function ConstrutorChat(props: {
  companyId: CompanyId
  projectId: ProjectId
  conversationId: ConversationId
}) {
  const { companyId, projectId, conversationId } = props
  const scope = { companyId, projectId }
  const queryClient = useQueryClient()
  const { words } = useConnectorCatalog(companyId)
  const { conversations } = useSuspenseQuery(construtorConversationsQuery(scope)).data
  const here = conversations.find((one) => one.id === conversationId)
  const listKey = construtorConversationsQuery(scope).queryKey
  const library = useQuery(toolsQuery(scope)).data?.tools
  const [agentId, setAgentId] = useState<AgentId>()
  // On a phone the draft covers the chat, so a call of the answer only keeps the agent and a tap shows it.
  const [covering, setCovering] = useState(false)
  const phone = useIsMobile()
  const room = useMemo(
    () => ({
      ...agentRoom(CONSTRUTOR_NAME, words),
      toolDescription: (slug: string) => library?.find((one) => one.slug === slug)?.description,
      openAgent: (id: AgentId, by: 'CALL' | 'TAP') => {
        setAgentId(id)
        if (by === 'TAP') setCovering(true)
        // Each save of the answer fills the draft the panel reads.
        void queryClient.invalidateQueries({
          queryKey: agentQuery({ companyId, projectId }, id).queryKey,
        })
      },
      openedAgent: agentId,
    }),
    [words, library, agentId, queryClient, companyId, projectId],
  )
  return (
    <RoomContext.Provider value={room}>
      <div key={conversationId} className="flex h-full min-h-0 flex-col bg-surface">
        <div className="flex min-w-0 items-center gap-sm border-b border-line px-md py-sm">
          <Link
            to="/companies/$companyId/projects/$projectId/agents"
            params={scope}
            aria-label="Voltar para Agentes"
            className="text-text-2"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
          </Link>
          <h1 className="max-w-full truncate font-display text-title">
            {here === undefined ? CONSTRUTOR_NAME : titleOf(here)}
          </h1>
        </div>
        <div className="min-h-0 flex-1">
          <Beside
            id="conexus-construtor"
            phone={phone}
            name={DRAFT_PANEL}
            handle="Redimensionar o rascunho"
            onCloseSide={() => setCovering(false)}
            side={
              agentId === undefined || (phone && !covering) ? undefined : (
                <DraftPanel scope={scope} agentId={agentId} inSheet={phone} />
              )
            }
            chat={
              <div className="flex h-full min-h-0 flex-col">
                <Chat
                  companyId={companyId}
                  conversationId={conversationId}
                  place={{ controller: CONSTRUTOR_CONTROLLER }}
                  conversationKey={listKey}
                  onGone={() => void queryClient.invalidateQueries({ queryKey: listKey })}
                  empty={CONSTRUTOR_FIRST}
                  placeholder={CONSTRUTOR_PLACEHOLDER}
                  noAccount={START_NO_ACCOUNT}
                  tools={{
                    context: <FixedProjectChip companyId={companyId} projectId={projectId} />,
                    notice: null,
                  }}
                  picker={({ session }) => <ComposerModelName model={session.model} />}
                />
              </div>
            }
          />
        </div>
      </div>
    </RoomContext.Provider>
  )
}
