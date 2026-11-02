import type { AssistantConversation, CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { ASSISTANT_CONTROLLER, listAssistantConversations } from '@conexus/hub-api'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { hubQueryPrefix } from '../../platform/hub.ts'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../ui/resizable.tsx'
import { Sheet, SheetContent } from '../../ui/sheet.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { AutomationBadge, ProposalCard } from '../automations/public.ts'
import type { OpenedFile, Room } from '../conversation/public.ts'
import { ASSISTANT_ROOM, Chat, RoomContext, START_NO_ACCOUNT } from '../conversation/public.ts'
import { useConnectorCatalog } from './connector-names.ts'
import { ContextBar, FixedProject } from './context-bar.tsx'
import { FilePanel } from './file.tsx'
import { Propose } from './propose.tsx'
import { assistantConversationQuery } from './queries.ts'
import { EMPTY_ASSISTANT, titleOf } from './text.ts'

type Props = { companyId: CompanyId; conversationId: ConversationId; projectId?: ProjectId }

/**
 * The conversation and, when the Assistant showed a file, the file beside it (or in a sheet over
 * it, on a phone, which holds the focus and closes on Esc). The chat keeps its place in the tree,
 * so showing a file does not remount it and drop its stream.
 */
function Beside(props: {
  chat: React.ReactNode
  file: React.ReactNode | undefined
  /** The file's name, the sheet's title on a phone. */
  fileName: string | undefined
  phone: boolean
  onCloseFile: () => void
}) {
  if (props.phone)
    return (
      <div className="h-full min-h-0">
        {props.chat}
        <Sheet
          open={props.file !== undefined}
          onOpenChange={(open) => !open && props.onCloseFile()}
        >
          <SheetContent
            side="right"
            title={props.fileName ?? ''}
            closeLabel="Fechar"
            className="p-0"
          >
            {props.file}
          </SheetContent>
        </Sheet>
      </div>
    )
  return (
    <ResizablePanelGroup id="conexus-assistant" className="h-full min-h-0">
      <ResizablePanel id="chat" minSize="320px">
        {props.chat}
      </ResizablePanel>
      {props.file !== undefined && (
        <>
          <ResizableHandle aria-label="Redimensionar o arquivo" />
          <ResizablePanel id="file" defaultSize="45%" minSize="280px">
            {props.file}
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}

/** The Assistant's room for a conversation: its connector names, the file beside it and the cards it draws. */
function useAssistantRoom(held: {
  companyId: CompanyId
  conversation: AssistantConversation
  file: OpenedFile | undefined
  setFile: (file: OpenedFile) => void
  setProposal: (summary: string) => void
}): Room {
  const { companyId, conversation, file, setFile, setProposal } = held
  const { words } = useConnectorCatalog(companyId)
  return useMemo(
    () => ({
      ...ASSISTANT_ROOM,
      connectors: words,
      openFile: setFile,
      openedPath: file?.path,
      createApp: setProposal,
      automationCard: ({ proposed, toolCallId }) => (
        <ProposalCard
          companyId={companyId}
          conversation={conversation}
          proposed={proposed}
          toolCallId={toolCallId}
        />
      ),
    }),
    [companyId, words, conversation, file?.path, setFile, setProposal],
  )
}

function Conversation(props: Props) {
  const { companyId, conversationId, projectId } = props
  const queryClient = useQueryClient()
  const { conversation } = useSuspenseQuery(
    assistantConversationQuery(companyId, conversationId),
  ).data
  const [file, setFile] = useState<OpenedFile>()
  const phone = useIsMobile()
  const [proposal, setProposal] = useState<string>()
  const room = useAssistantRoom({ companyId, conversation, file, setFile, setProposal })
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
            phone={phone}
            fileName={file?.name}
            onCloseFile={() => setFile(undefined)}
            chat={
              <div className="flex h-full min-h-0 flex-col bg-canvas">
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
                  bar={
                    <div className="px-md pb-sm">
                      <ContextBar
                        companyId={companyId}
                        projectId={projectId}
                        conversation={conversation}
                        trailing={
                          projectId !== undefined && (
                            <FixedProject companyId={companyId} projectId={projectId} />
                          )
                        }
                      />
                    </div>
                  }
                />
              </div>
            }
            file={
              file === undefined ? undefined : (
                <FilePanel
                  companyId={companyId}
                  conversationId={conversationId}
                  shown={file}
                  onClose={phone ? undefined : () => setFile(undefined)}
                  inSheet={phone}
                />
              )
            }
          />
        </div>
      </div>
      <Propose companyId={companyId} summary={proposal} onClose={() => setProposal(undefined)} />
    </RoomContext.Provider>
  )
}

/**
 * A conversation with the Assistant (criteria 24 to 27): the Builder's transcript and box over the
 * Assistant's session, its bar of connections above the box and the file it showed beside. A
 * conversation lives at one address, its Projeto's or the company's: the loader finds the other not found.
 */
export function AssistantChat(props: Props) {
  return <Conversation key={props.conversationId} {...props} />
}
