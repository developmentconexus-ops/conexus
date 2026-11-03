import type { AgentDetail, AgentId, CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon, MoreHorizontalIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { writeFailureText } from '../../platform/hub.ts'
import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../ui/resizable.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { ConfigPanel } from './config-panel.tsx'
import { useOpenAgentConversation } from './open-conversation.ts'
import { PublishButton } from './publish.tsx'
import { agentQuery, agentsPrefix, sendDeletion } from './queries.ts'
import { StateStamp } from './rows.tsx'
import { TestPanel } from './test-panel.tsx'
import { deleteWarning, UNCONFIRMED_DELETE } from './text.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }

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

function Header(props: {
  scope: Scope
  agent: AgentDetail
  opener: ReturnType<typeof useOpenAgentConversation>
  onTest: () => void
}) {
  const { scope, agent, opener } = props
  const [confirming, setConfirming] = useState(false)
  return (
    <header className="flex flex-col gap-xs border-b border-line px-md py-sm">
      <Link
        to="/companies/$companyId/projects/$projectId/agents"
        params={scope}
        className="inline-flex w-fit items-center gap-xs text-label text-text-2"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Agentes
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div className="flex min-w-0 flex-col gap-xs">
          <h1 className="truncate font-display text-title">{agent.name}</h1>
          <div className="flex flex-wrap items-center gap-md">
            <StateStamp state={agent.state} />
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <Button
            size="sm"
            disabled={opener.pending}
            onClick={() => {
              props.onTest()
              void opener.open(true)
            }}
          >
            Testar
          </Button>
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
              <DropdownMenuItem className="text-danger" onClick={() => setConfirming(true)}>
                Apagar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ConfirmDelete scope={scope} agent={agent} open={confirming} onOpenChange={setConfirming} />
    </header>
  )
}

/**
 * The page of an agent (step 24.3, U5, criteria 27 and 28), the structure of the Construtor's
 * prototype: the configuration is the page, each section with its name on the left and its value
 * on the right, and the test conversation sits in a panel on the right, with the switch between
 * the person's conversations with the agent. On a phone the page and the panel are two tabs,
 * **Configuração** and **Conversas**; **Apagar** is in the **⋯** menu on every width.
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
  const opener = useOpenAgentConversation(scope, agentId)
  const [tab, setTab] = useState(props.conversationId === undefined ? 'configuracao' : 'conversas')
  const page = (
    <div className="px-md pb-xl">
      <ConfigPanel scope={scope} agent={agent} />
    </div>
  )
  const test = (
    <TestPanel scope={scope} agent={agent} conversationId={props.conversationId} opener={opener}>
      {props.children}
    </TestPanel>
  )
  const header = (
    <Header scope={scope} agent={agent} opener={opener} onTest={() => setTab('conversas')} />
  )
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {phone ? (
        <>
          {header}
          <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1 gap-0">
            <TabsList className="px-md">
              <TabsTrigger value="configuracao">Configuração</TabsTrigger>
              <TabsTrigger value="conversas">Conversas</TabsTrigger>
            </TabsList>
            <TabsContent value="configuracao" className="min-h-0 overflow-y-auto">
              {page}
            </TabsContent>
            <TabsContent value="conversas" className="min-h-0">
              {test}
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <ResizablePanelGroup id="conexus-agent" className="min-h-0 flex-1">
          <ResizablePanel id="page" minSize="40%">
            <div className="flex h-full min-h-0 flex-col overflow-y-auto">
              {header}
              {page}
            </div>
          </ResizablePanel>
          <ResizableHandle aria-label="Redimensionar a conversa de teste" />
          <ResizablePanel id="test" defaultSize="380px" minSize="320px" maxSize="60%">
            {test}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  )
}
