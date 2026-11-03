import type { CompanyId, ConstrutorResult, ConversationId, ProjectId } from '@conexus/hub-api'
import { CONSTRUTOR_CONTROLLER } from '@conexus/hub-api'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { useMemo } from 'react'
import { FixedProjectChip, useConnectorCatalog } from '../assistant/public.ts'
import {
  agentRoom,
  Chat,
  ComposerModelName,
  RoomContext,
  START_NO_ACCOUNT,
} from '../conversation/public.ts'
import { DraftCard } from './draft-card.tsx'
import { construtorConversationsQuery } from './queries.ts'
import { CONSTRUTOR_FIRST, CONSTRUTOR_NAME, CONSTRUTOR_PLACEHOLDER, titleOf } from './text.ts'

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
  const room = useMemo(
    () => ({
      ...agentRoom(CONSTRUTOR_NAME, words),
      agentCard: (result: ConstrutorResult) => (
        <DraftCard companyId={companyId} projectId={projectId} result={result} />
      ),
    }),
    [companyId, projectId, words],
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
    </RoomContext.Provider>
  )
}
