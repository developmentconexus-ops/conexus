import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { ASSISTANT_CONTROLLER } from '@conexus/hub-api'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { dayAndHour } from '../../platform/dates.ts'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../ui/resizable.tsx'
import { NotFound } from '../../ui/states.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import type { OpenedFile, Room } from '../conversation/public.ts'
import { Chat, RoomContext } from '../conversation/public.ts'
import { useConnectorNames } from './connector-names.ts'
import { ContextBar } from './context-bar.tsx'
import { FilePanel } from './file.tsx'
import { Propose } from './propose.tsx'
import { assistantConversationQuery } from './queries.ts'
import { EMPTY_ASSISTANT } from './text.ts'

type Props = { companyId: CompanyId; conversationId: ConversationId; projectId?: ProjectId }

/** The conversation and, when the Assistant showed a file, the file beside it (or over it, on a phone). */
function Beside(props: { chat: React.ReactNode; file: React.ReactNode | undefined }) {
  const phone = useIsMobile()
  if (props.file === undefined) return <div className="h-full min-h-0">{props.chat}</div>
  if (phone)
    return (
      <div className="relative h-full min-h-0">
        {props.chat}
        <div className="absolute inset-0 z-10">{props.file}</div>
      </div>
    )
  return (
    <ResizablePanelGroup id="conexus-assistant" className="h-full min-h-0">
      <ResizablePanel id="chat" minSize="320px">
        {props.chat}
      </ResizablePanel>
      <ResizableHandle aria-label="Redimensionar o arquivo" />
      <ResizablePanel id="file" defaultSize="45%" minSize="280px">
        {props.file}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

function Conversation(props: Props) {
  const { companyId, conversationId, projectId } = props
  const queryClient = useQueryClient()
  const { conversation } = useSuspenseQuery(
    assistantConversationQuery(companyId, conversationId),
  ).data
  const [file, setFile] = useState<OpenedFile>()
  const [proposal, setProposal] = useState<string>()
  const connectorName = useConnectorNames(companyId)
  const room: Room = useMemo(
    () => ({
      controller: ASSISTANT_CONTROLLER,
      agent: 'Assistente',
      connectorName,
      openFile: setFile,
      openedPath: file?.path,
      createApp: setProposal,
    }),
    [connectorName, file?.path],
  )
  return (
    <RoomContext.Provider value={room}>
      <div className="flex h-full min-h-0 flex-col">
        <h1 className="truncate border-b border-line px-md py-sm font-display text-title">
          {conversation.title ?? `Conversa de ${dayAndHour(conversation.updatedAt)}`}
        </h1>
        <div className="min-h-0 flex-1">
          <Beside
            chat={
              <div className="flex h-full min-h-0 flex-col bg-canvas">
                <Chat
                  companyId={companyId}
                  conversationId={conversationId}
                  place={{ controller: ASSISTANT_CONTROLLER }}
                  conversationKey={assistantConversationQuery(companyId, conversationId).queryKey}
                  onGone={() => void queryClient.invalidateQueries({ queryKey: ['assistant'] })}
                  empty={EMPTY_ASSISTANT}
                  bar={
                    <div className="px-md pb-sm">
                      <ContextBar
                        companyId={companyId}
                        projectId={projectId}
                        conversation={conversation}
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
                  onClose={() => setFile(undefined)}
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
 * conversation lives at one address, its Projeto's or the company's: at the other, it is not found.
 */
export function AssistantChat(props: Props) {
  const { conversation } = useSuspenseQuery(
    assistantConversationQuery(props.companyId, props.conversationId),
  ).data
  if (conversation.projectId !== (props.projectId ?? null)) return <NotFound />
  return <Conversation key={props.conversationId} {...props} />
}
