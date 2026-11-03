import type { AgentDetail, AgentId, CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon, MoreHorizontalIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { writeFailureText } from '../../platform/hub.ts'
import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { BlockSentence, blockRow } from '../../ui/block.tsx'
import { Button } from '../../ui/button.tsx'
import { Dialog, DialogContent } from '../../ui/dialog.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import { Empty } from '../../ui/states.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { ConfigPanel } from './config-panel.tsx'
import { PublishButton } from './publish.tsx'
import {
  agentConversationsQuery,
  agentQuery,
  agentsPrefix,
  sendAgentConversation,
  sendDeletion,
} from './queries.ts'
import { ReadStates } from './read-states.tsx'
import { ConversationLine, StateStamp } from './rows.tsx'
import {
  deleteWarning,
  NO_AGENT_CONVERSATIONS,
  NO_CONVERSATION_OPEN,
  UNCONFIRMED_CREATION,
  UNCONFIRMED_DELETE,
} from './text.ts'
import { Versions } from './versions.tsx'

type Scope = { companyId: CompanyId; projectId: ProjectId }

function Conversations(props: {
  scope: Scope
  agent: AgentDetail
  openId: ConversationId | undefined
}) {
  const { scope, agent } = props
  const read = useQuery(agentConversationsQuery(scope, agent.id))
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const create = useMutation(sendAgentConversation)
  const attempt = useAttemptKey()
  const [error, setError] = useState<string>()
  const now = new Date()

  async function open(draft: boolean) {
    setError(undefined)
    try {
      const { conversation } = await attempt((attemptKey) =>
        create.mutateAsync({
          params: { ...scope, agentId: agent.id },
          body: { draft },
          attemptKey,
        }),
      )
      await queryClient.invalidateQueries({
        queryKey: agentConversationsQuery(scope, agent.id).queryKey,
      })
      await navigate({
        to: '/companies/$companyId/projects/$projectId/agents/$agentId/$conversationId',
        params: { ...scope, agentId: agent.id, conversationId: conversation.id },
      })
    } catch (failure) {
      setError(writeFailureText(failure, UNCONFIRMED_CREATION))
    }
  }

  return (
    <div className="flex flex-col p-xs">
      <div className="flex flex-wrap gap-sm px-sm py-xs">
        {agent.state.kind === 'PUBLISHED' && (
          <Button size="sm" disabled={create.isPending} onClick={() => void open(false)}>
            Nova conversa
          </Button>
        )}
        <Button size="sm" disabled={create.isPending} onClick={() => void open(true)}>
          Testar rascunho
        </Button>
      </div>
      {error !== undefined && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <ReadStates read={read} />
      {read.data?.conversations.length === 0 && (
        <BlockSentence>{NO_AGENT_CONVERSATIONS}</BlockSentence>
      )}
      <ul>
        {read.data?.conversations.map((conversation) => (
          <li key={conversation.id}>
            <Link
              to="/companies/$companyId/projects/$projectId/agents/$agentId/$conversationId"
              params={{ ...scope, agentId: agent.id, conversationId: conversation.id }}
              className={`${blockRow} hover:bg-surface-3`}
            >
              <ConversationLine
                conversation={conversation}
                now={now}
                mark={conversation.draft && <span className="text-fact text-text-2">Teste</span>}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ConfirmDelete(props: {
  scope: Scope
  agent: AgentDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { scope, agent } = props
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const remove = useMutation(sendDeletion)
  const [error, setError] = useState<string>()
  async function confirm() {
    setError(undefined)
    try {
      await remove.mutateAsync({ params: { ...scope, agentId: agent.id } })
      queryClient.removeQueries({ queryKey: agentQuery(scope, agent.id).queryKey })
      await queryClient.invalidateQueries({ queryKey: agentsPrefix(scope) })
      await navigate({ to: '/companies/$companyId/projects/$projectId/agents', params: scope })
    } catch (failure) {
      setError(writeFailureText(failure, UNCONFIRMED_DELETE))
    }
  }
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent title={`Apagar ${agent.name}?`} description={deleteWarning(agent.name)}>
        {error !== undefined && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-md">
          <Button
            variant="danger-confirm"
            disabled={remove.isPending}
            onClick={() => void confirm()}
          >
            {remove.isPending ? 'Apagando…' : 'Apagar agente'}
          </Button>
          <Button disabled={remove.isPending} onClick={() => props.onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function Header(props: { scope: Scope; agent: AgentDetail; phone: boolean }) {
  const { scope, agent, phone } = props
  const [confirming, setConfirming] = useState(false)
  const [versions, setVersions] = useState(false)
  return (
    <header className="flex flex-wrap items-center justify-between gap-sm border-b border-line px-md py-sm">
      <div className="flex min-w-0 flex-col">
        <Link
          to="/companies/$companyId/projects/$projectId/agents"
          params={scope}
          className="inline-flex items-center gap-xs text-label text-text-2"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          Agentes
        </Link>
        <h1 className="truncate font-display text-title">{agent.name}</h1>
        <StateStamp state={agent.state} />
      </div>
      <div className="flex items-center gap-sm">
        <PublishButton scope={scope} agent={agent} />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="icon-sm" variant="ghost" aria-label={`Mais ações: ${agent.name}`} />
            }
          >
            <MoreHorizontalIcon aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {phone && (
              <DropdownMenuItem onClick={() => setVersions(true)}>Versões</DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-danger" onClick={() => setConfirming(true)}>
              Apagar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ConfirmDelete scope={scope} agent={agent} open={confirming} onOpenChange={setConfirming} />
      {phone && (
        <Dialog open={versions} onOpenChange={setVersions}>
          <DialogContent title={agent.name}>
            <Versions {...scope} agentId={agent.id} />
          </DialogContent>
        </Dialog>
      )}
    </header>
  )
}

/**
 * The page of an agent (step 24.3, U5, criteria 27 and 28), the structure of the Studio's agent page
 * (conversations, conversation, configuration) over our own pieces: the person's conversations
 * with it on the left, the conversation in the middle (`children`, the route's outlet) and the
 * editable configuration on the right, with **Publicar** and **Versões**. On a phone the columns
 * are two tabs, **Conversas** and **Configuração**, and **Versões** goes to the **⋯** menu, where **Apagar**
 * is on every width.
 */
export function AgentPage(props: {
  companyId: CompanyId
  projectId: ProjectId
  agentId: AgentId
  /** The conversation the address names, if any. */
  conversationId: ConversationId | undefined
  children: ReactNode
}) {
  const { companyId, projectId, agentId } = props
  const scope = { companyId, projectId }
  const { agent } = useSuspenseQuery(agentQuery(scope, agentId)).data
  const phone = useIsMobile()
  const config = (
    <div className="px-md pb-xl">
      <ConfigPanel scope={scope} agent={agent} />
      {!phone && <Versions companyId={companyId} projectId={projectId} agentId={agentId} />}
    </div>
  )
  const conversations = <Conversations scope={scope} agent={agent} openId={props.conversationId} />
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <Header scope={scope} agent={agent} phone={phone} />
      {phone ? (
        <Tabs defaultValue="conversas" className="min-h-0 flex-1 gap-0">
          <TabsList className="px-md">
            <TabsTrigger value="conversas">Conversas</TabsTrigger>
            <TabsTrigger value="configuracao">Configuração</TabsTrigger>
          </TabsList>
          <TabsContent value="conversas" className="min-h-0 overflow-y-auto">
            {props.conversationId === undefined ? conversations : props.children}
          </TabsContent>
          <TabsContent value="configuracao" className="min-h-0 overflow-y-auto">
            {config}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[15rem_minmax(0,1fr)_24rem]">
          <aside aria-label="Conversas" className="min-h-0 overflow-y-auto border-r border-line">
            {conversations}
          </aside>
          <div className="min-h-0 min-w-0">
            {props.conversationId === undefined ? (
              <div className="flex h-full items-center justify-center p-md">
                <Empty>{NO_CONVERSATION_OPEN}</Empty>
              </div>
            ) : (
              props.children
            )}
          </div>
          <div className="min-h-0 overflow-y-auto border-l border-line">{config}</div>
        </div>
      )}
    </div>
  )
}
