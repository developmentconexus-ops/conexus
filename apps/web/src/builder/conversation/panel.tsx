import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { BUILDER_CONTROLLER, PreviewData } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, useLocation } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { sentenceOfCode } from '../../platform/hub.ts'
import { Notice } from '../../ui/notice.tsx'
import { previewChanged } from '../preview/public.ts'
import { sourceChanged } from '../source/public.ts'
import { Chat } from './chat.tsx'
import { useConnectorCatalog } from './connector-catalog.ts'
import type { Item } from './conversation-switch.tsx'
import { ConversationSwitch } from './conversation-switch.tsx'
import { FirstMessage } from './first-message.tsx'
import { ModelChoice } from './model-choice.tsx'
import { allConversationsQueryKey, conversationQuery, sendModel } from './queries.ts'
import type { RoomOf } from './room.ts'
import { appBuilderRoom, RoomContext } from './room.ts'
import { EMPTY_CONVERSATION, REQUEST_NOT_SENT, titleOf, WRITE_AGAIN } from './text.ts'

const route = getRouteApi(
  '/_app/companies/$companyId/projects/$projectId/conversations/$conversationId',
)

const emptyRoute = getRouteApi('/_app/companies/$companyId/projects/$projectId/')

function PanelFrame(props: { current: Item | undefined; children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <ConversationSwitch current={props.current} />
      {props.children}
    </div>
  )
}

type Params = { companyId: CompanyId; projectId: ProjectId; conversationId: ConversationId }

/** What a Builder's run changes beyond the transcript: a version it saved, the Projeto's files; a version put on the app, its Prévia. */
function heardOnProjeto(
  queryClient: QueryClient,
  scope: Pick<Params, 'companyId' | 'projectId'>,
): RoomOf<'APP_BUILDER'>['heard'] {
  return (event) => {
    if (event.type !== 'message_start') return
    const { parts } = event.message.content
    if (parts.some((part) => part.type === 'data-conexus-version'))
      void sourceChanged(queryClient, scope)
    const ready = parts.some(
      (part) =>
        part.type === 'data-conexus-preview' &&
        PreviewData.safeParse(part.data).data?.state === 'ready',
    )
    if (ready) void previewChanged(queryClient, scope)
  }
}

/** The Builder's conversation: the screen of `chat.tsx` on the Builder's controller, with the model's button. */
function BuilderChat(params: Params) {
  const { companyId, projectId, conversationId } = params
  const queryClient = useQueryClient()
  const { words } = useConnectorCatalog(companyId)
  const room = useMemo(
    () => appBuilderRoom(words, companyId, heardOnProjeto(queryClient, { companyId, projectId })),
    [words, companyId, projectId, queryClient],
  )
  return (
    <RoomContext.Provider value={room}>
      <Chat
        companyId={companyId}
        conversationId={conversationId}
        place={{ controller: BUILDER_CONTROLLER, projectId }}
        conversationKey={conversationQuery(companyId, projectId, conversationId).queryKey}
        listKeys={[allConversationsQueryKey(companyId, projectId)]}
        empty={EMPTY_CONVERSATION}
        picker={({ session, providers, onError }) => (
          <ModelChoice
            controller={BUILDER_CONTROLLER}
            conversationId={conversationId}
            write={{ ...sendModel, mutationFn: (body) => sendModel.mutationFn({ params, body }) }}
            session={session}
            providers={providers}
            onError={onError}
          />
        )}
      />
    </RoomContext.Provider>
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
