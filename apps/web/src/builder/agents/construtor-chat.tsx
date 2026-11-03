import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { CONSTRUTOR_CONTROLLER } from '@conexus/hub-api'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { agentRoom, Chat, RoomContext, START_NO_ACCOUNT } from '../conversation/public.ts'
import { construtorConversationsQuery } from './queries.ts'
import { CONSTRUTOR_FIRST, CONSTRUTOR_NAME, CONSTRUTOR_PLACEHOLDER, titleOf } from './text.ts'

const ROOM = agentRoom(CONSTRUTOR_NAME)

/** A conversation with the Construtor: the conversation of the 24.1 over the `construtor` controller (criterion 26). */
export function ConstrutorChat(props: {
  companyId: CompanyId
  projectId: ProjectId
  conversationId: ConversationId
}) {
  const { companyId, projectId, conversationId } = props
  const scope = { companyId, projectId }
  const queryClient = useQueryClient()
  const { conversations } = useSuspenseQuery(construtorConversationsQuery(scope)).data
  const here = conversations.find((one) => one.id === conversationId)
  const listKey = construtorConversationsQuery(scope).queryKey
  return (
    <RoomContext.Provider value={ROOM}>
      <div key={conversationId} className="flex h-full min-h-0 flex-col bg-canvas">
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
        <Chat
          companyId={companyId}
          conversationId={conversationId}
          place={{ controller: CONSTRUTOR_CONTROLLER }}
          conversationKey={listKey}
          onGone={() => void queryClient.invalidateQueries({ queryKey: listKey })}
          empty={CONSTRUTOR_FIRST}
          placeholder={CONSTRUTOR_PLACEHOLDER}
          noAccount={START_NO_ACCOUNT}
        />
      </div>
    </RoomContext.Provider>
  )
}
