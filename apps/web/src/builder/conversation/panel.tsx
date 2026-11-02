import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { BUILDER_CONTROLLER } from '@conexus/hub-api'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, useLocation } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { sentenceOfCode } from '../../platform/hub.ts'
import { Notice } from '../../ui/notice.tsx'
import { Chat } from './chat.tsx'
import type { Item } from './conversation-switch.tsx'
import { ConversationSwitch } from './conversation-switch.tsx'
import { FirstMessage } from './first-message.tsx'
import { ModelChoice } from './model-choice.tsx'
import { allConversationsQueryKey, conversationQuery } from './queries.ts'
import { EMPTY_CONVERSATION, REQUEST_NOT_SENT, titleOf, WRITE_AGAIN } from './text.ts'

const route = getRouteApi(
  '/_app/companies/$companyId/projects/$projectId/conversations/$conversationId',
)

const emptyRoute = getRouteApi('/_app/companies/$companyId/projects/$projectId/')

function PanelFrame(props: { current: Item | undefined; children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <ConversationSwitch current={props.current} />
      {props.children}
    </div>
  )
}

type Params = { companyId: CompanyId; projectId: ProjectId; conversationId: ConversationId }

/** The Builder's conversation: the screen of `chat.tsx` on the Builder's controller, with the model's button. */
function BuilderChat(params: Params) {
  const { companyId, projectId, conversationId } = params
  const queryClient = useQueryClient()
  return (
    <Chat
      companyId={companyId}
      conversationId={conversationId}
      place={{ controller: BUILDER_CONTROLLER, projectId }}
      conversationKey={conversationQuery(companyId, projectId, conversationId).queryKey}
      onGone={() =>
        void queryClient.invalidateQueries({
          queryKey: allConversationsQueryKey(companyId, projectId),
        })
      }
      empty={EMPTY_CONVERSATION}
      picker={({ session, providers, onError }) => (
        <ModelChoice
          ids={params}
          conversationId={conversationId}
          session={session}
          providers={providers}
          onError={onError}
        />
      )}
    />
  )
}

/**
 * One conversation of the panel: the model, the transcript with the answer arriving, and the field.
 * A switch of conversation starts the screen over.
 */
export function Panel() {
  const { companyId, projectId, conversationId } = route.useParams()
  const { conversation } = useSuspenseQuery(
    conversationQuery(companyId, projectId, conversationId),
  ).data
  return (
    <PanelFrame current={{ value: conversationId, label: titleOf(conversation) }}>
      <BuilderChat
        key={conversationId}
        companyId={companyId}
        projectId={projectId}
        conversationId={conversationId}
      />
    </PanelFrame>
  )
}

/** A Projeto with no conversation opens ready to type, and says why when Início created it and the Hub refused the model. */
export function EmptyPanel() {
  const { companyId, projectId } = emptyRoute.useParams()
  const refused = useLocation({ select: (location) => location.state.refused })
  return (
    <PanelFrame current={undefined}>
      {refused !== undefined && (
        <div className="px-md pt-md">
          <Notice>
            {REQUEST_NOT_SENT} {sentenceOfCode(refused)} {WRITE_AGAIN}
          </Notice>
        </div>
      )}
      <FirstMessage companyId={companyId} projectId={projectId} />
    </PanelFrame>
  )
}
