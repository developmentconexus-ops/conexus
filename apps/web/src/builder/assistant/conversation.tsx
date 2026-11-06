import type { AssistantConversation, CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import {
  ASSISTANT_CONTROLLER,
  assistantFilePath,
  listAssistantConversations,
} from '@conexus/hub-api'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { hubQueryPrefix } from '../../platform/hub.ts'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { AutomationBadge, ProposalCard } from '../automations/public.ts'
import type { OpenedFile, Room } from '../conversation/public.ts'
import {
  ASSISTANT_ROOM,
  Beside,
  Chat,
  fileSide,
  ModelChoice,
  RoomContext,
  START_NO_ACCOUNT,
} from '../conversation/public.ts'
import { useComposerTools } from './composer-tools.tsx'
import { useConnectorCatalog } from './connector-names.ts'
import { AppProposalCard } from './propose.tsx'
import { assistantConversationQuery, sendAssistantModel } from './queries.ts'
import { EMPTY_ASSISTANT, titleOf } from './text.ts'

type Props = { companyId: CompanyId; conversationId: ConversationId; projectId?: ProjectId }

/** The Assistant's room for a conversation: its connector names, the file beside it and the cards it draws. */
function useAssistantRoom(held: {
  companyId: CompanyId
  conversation: AssistantConversation
  file: OpenedFile | undefined
  setFile: (file: OpenedFile) => void
}): Room {
  const { companyId, conversation, file, setFile } = held
  const { words } = useConnectorCatalog(companyId)
  return useMemo(
    () => ({
      ...ASSISTANT_ROOM,
      connectors: words,
      openFile: setFile,
      openedPath: file?.path,
      appCard: ({ proposed, toolCallId, closed }) => (
        <AppProposalCard
          companyId={companyId}
          conversation={conversation}
          proposed={proposed}
          toolCallId={toolCallId}
          closed={closed}
        />
      ),
      automationCard: ({ proposed, toolCallId }) => (
        <ProposalCard
          companyId={companyId}
          conversation={conversation}
          proposed={proposed}
          toolCallId={toolCallId}
        />
      ),
    }),
    [companyId, words, conversation, file?.path, setFile],
  )
}

function Conversation(props: Props) {
  const { companyId, conversationId } = props
  const queryClient = useQueryClient()
  const { conversation } = useSuspenseQuery(
    assistantConversationQuery(companyId, conversationId),
  ).data
  const [file, setFile] = useState<OpenedFile>()
  const phone = useIsMobile()
  const room = useAssistantRoom({ companyId, conversation, file, setFile })
  const tools = useComposerTools({ kind: 'CONVERSATION', companyId, conversation })
  return (
    <RoomContext.Provider value={room}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-w-0 flex-wrap items-center gap-x-sm gap-y-xs border-b border-line px-md py-sm">
          <h1 className="max-w-full truncate font-display text-title">{titleOf(conversation)}</h1>
          {conversation.automation !== null && (
            <AutomationBadge name={conversation.automation.name} />
          )}
        </div>
        <div className="min-h-0 flex-1">
          <Beside
            id="conexus-assistant"
            phone={phone}
            name={file?.name ?? ''}
            handle="Redimensionar o arquivo"
            onCloseSide={() => setFile(undefined)}
            chat={
              <div className="flex h-full min-h-0 flex-col bg-surface">
                <Chat
                  companyId={companyId}
                  conversationId={conversationId}
                  place={{ controller: ASSISTANT_CONTROLLER }}
                  conversationKey={assistantConversationQuery(companyId, conversationId).queryKey}
                  onGone={() =>
                    void queryClient.invalidateQueries({
                      queryKey: hubQueryPrefix(listAssistantConversations, { companyId }),
                    })
                  }
                  empty={EMPTY_ASSISTANT}
                  noAccount={START_NO_ACCOUNT}
                  tools={tools}
                  picker={({ session, providers, onError }) => (
                    <ModelChoice
                      controller={ASSISTANT_CONTROLLER}
                      conversationId={conversationId}
                      session={session}
                      providers={providers}
                      write={{
                        ...sendAssistantModel,
                        mutationFn: (body) =>
                          sendAssistantModel.mutationFn({
                            params: { companyId, conversationId },
                            body,
                          }),
                      }}
                      onError={onError}
                    />
                  )}
                />
              </div>
            }
            side={fileSide(file, (path) => assistantFilePath({ companyId, conversationId, path }), {
              phone,
              close: () => setFile(undefined),
            })}
          />
        </div>
      </div>
    </RoomContext.Provider>
  )
}

/**
 * A conversation with the Assistant (criteria 24 to 27): the Builder's transcript and box over the
 * Assistant's session, its folder and tools in the box's row and the file it showed beside. A
 * conversation lives at one address, its Projeto's or the company's: the loader finds the other not found.
 */
export function AssistantChat(props: Props) {
  return <Conversation key={props.conversationId} {...props} />
}
