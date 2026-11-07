import type { AgentDetail, CompanyId, ConversationId, OpenWrite, ProjectId } from '@conexus/hub-api'
import { AGENTS_CONTROLLER, agentFilePath } from '@conexus/hub-api'
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { useConnectorCatalog } from '../assistant/public.ts'
import type { OpenedFile, WriteTool } from '../conversation/public.ts'
import {
  agentRoom,
  Beside,
  Chat,
  fileSide,
  RoomContext,
  START_NO_ACCOUNT,
} from '../conversation/public.ts'
import { FileWidth } from './file-width.ts'
import { agentConversationsQuery, agentQuery, openWritesQuery } from './queries.ts'
import { askAgent, TEST_BANNER } from './text.ts'

/** The room of a conversation with the agent: its name, its tools' words and the file its Computador showed beside it. */
function useAgentRoom(
  agent: AgentDetail,
  words: ReturnType<typeof useConnectorCatalog>['words'],
  held: {
    file: OpenedFile | undefined
    setFile: (file: OpenedFile) => void
    writes: { openWrites: readonly OpenWrite[]; refresh: () => void }
  },
) {
  const { file, setFile, writes } = held
  return useMemo(
    () => ({
      ...agentRoom(agent.name, words),
      toolDescription: (slug: string) =>
        agent.tools.find((one) => one.slug === slug)?.version.description,
      writeOf: (toolName: string) => writeOf(agent, toolName),
      openWrites: writes.openWrites,
      refreshOpenWrites: writes.refresh,
      openFile: setFile,
      openedPath: file?.path,
    }),
    [agent, words, file?.path, setFile, writes],
  )
}

/** The write a tool of the agent is, with its connection and the operation's name; none for a read. */
function writeOf(agent: AgentDetail, toolName: string): WriteTool | undefined {
  const tool = agent.tools.find((one) => `tool_${one.slug}` === toolName)
  if (tool === undefined || tool.kind !== 'PRESET' || tool.effect !== 'WRITE') return undefined
  const connection = agent.offered.find((one) => one.connectionId === tool.connectionId)
  if (connection === undefined) return undefined
  const label = connection.writes.find((one) => one.operation === tool.operation)?.label
  return {
    connectionId: tool.connectionId,
    connector: connection.connector,
    connection: connection.name,
    operation: tool.operation,
    label: label ?? tool.operation,
  }
}

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
  const [file, setFile] = useState<OpenedFile>()
  const phone = useIsMobile()
  const opened = useQuery(openWritesQuery(scope, agentId, conversationId))
  const writes = useMemo(
    () => ({ openWrites: opened.data?.writes ?? [], refresh: () => void opened.refetch() }),
    [opened.data, opened.refetch],
  )
  const room = useAgentRoom(agent, words, { file, setFile, writes })
  const widen = useContext(FileWidth)
  const open = file !== undefined
  useEffect(() => {
    if (!open) return
    widen(true)
    return () => widen(false)
  }, [open, widen])
  return (
    <RoomContext.Provider value={room}>
      <div key={conversationId} className="flex h-full min-h-0 flex-col bg-surface">
        {draft && (
          <p className="border-b border-line bg-surface-3 px-md py-xs text-label text-text-2">
            {TEST_BANNER}
          </p>
        )}
        <div className="min-h-0 flex-1">
          <Beside
            id="conexus-agent-file"
            phone={phone}
            name={file?.name ?? ''}
            handle="Redimensionar o arquivo"
            onCloseSide={() => setFile(undefined)}
            chat={
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
            }
            side={fileSide(file, (path) => agentFilePath({ companyId, conversationId, path }), {
              phone,
              close: () => setFile(undefined),
            })}
          />
        </div>
      </div>
    </RoomContext.Provider>
  )
}
