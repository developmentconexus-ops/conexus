import type { CompanyId, ProjectId, ToolSummary } from '@conexus/hub-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { HubFailure, sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { AreaFrame, toolsQuery } from '../agents/public.ts'
import { sendToolDeletion } from './queries.ts'
import { deleteWarning, NO_TOOLS_YET, NOBODY_USES, UNCONFIRMED_DELETE } from './text.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }

/** What the Hub refused when it did not delete: the agents that still use the tool, each a link, or the row's own sentence. */
function Refused(props: { scope: Scope; failure: unknown }) {
  const { failure } = props
  if (failure instanceof HubFailure && failure.code === 'TOOL_IN_USE' && failure.agents) {
    return (
      <p role="alert" className="text-danger">
        Usada por{' '}
        {failure.agents.map((agent, index) => (
          <span key={agent.id}>
            {index > 0 && ', '}
            <Link
              to="/companies/$companyId/projects/$projectId/agents/$agentId"
              params={{ ...props.scope, agentId: agent.id }}
              className="underline"
            >
              {agent.name}
            </Link>
          </span>
        ))}
        .
      </p>
    )
  }
  return (
    <p role="alert" className="text-danger">
      {writeFailureText(failure, UNCONFIRMED_DELETE)}
    </p>
  )
}

function ToolRow({ scope, tool }: { scope: Scope; tool: ToolSummary }) {
  const queryClient = useQueryClient()
  const remove = useMutation(sendToolDeletion)
  const [failure, setFailure] = useState<unknown>()
  const [confirming, setConfirming] = useState(false)
  const cancel = useRef<HTMLButtonElement>(null)
  async function erase() {
    setConfirming(false)
    setFailure(undefined)
    try {
      await remove.mutateAsync({ params: { ...scope, toolId: tool.id } })
    } catch (error) {
      setFailure(error)
    } finally {
      // Whatever the Hub said, the list is read again: a tool already gone leaves it (`TOOL_NOT_FOUND`).
      await queryClient.invalidateQueries({ queryKey: toolsQuery(scope).queryKey })
    }
  }
  return (
    <li className="flex flex-col gap-xs border-b border-line px-sm py-sm">
      <div className="flex items-center justify-between gap-md">
        <Link
          to="/companies/$companyId/projects/$projectId/agents/tools/$toolId"
          params={{ ...scope, toolId: tool.id }}
          className="min-w-0 truncate font-semibold hover:underline"
        >
          {tool.slug}
        </Link>
        <span className="flex shrink-0 items-center gap-sm">
          <span className="text-fact text-text-2">v{tool.latest.number}</span>
          <Button
            size="sm"
            variant="danger"
            aria-label={`Apagar ${tool.slug}`}
            disabled={remove.isPending}
            onClick={() => setConfirming(true)}
          >
            Apagar
          </Button>
        </span>
      </div>
      <p>{tool.description}</p>
      <p className="text-fact text-text-2">
        Lê {tool.readLabel} em {tool.connectionName}
      </p>
      <p className="text-fact text-text-2">
        {tool.usedBy.length === 0 ? NOBODY_USES : tool.usedBy.map((one) => one.name).join(', ')}
      </p>
      {failure !== undefined && <Refused scope={scope} failure={failure} />}
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent
          title={`Apagar ${tool.slug}?`}
          description={deleteWarning(tool.slug)}
          initialFocus={cancel}
        >
          <div className="flex flex-wrap gap-md">
            <Button variant="danger-confirm" onClick={() => void erase()}>
              Apagar ferramenta
            </Button>
            <Button ref={cancel} onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}

/**
 * The tab **Ferramentas** of the area (step 24.3.1, U7, criterion 32): the tools of the company's
 * library the Projeto may use, each with what it does and reads, its latest version and the agents
 * that use it, read from `listTools` alone.
 */
export function ToolsTab(scope: Scope) {
  const read = useQuery(toolsQuery(scope))
  return (
    <AreaFrame scope={scope} tab="ferramentas">
      {read.isPending && <Skeleton className="h-20 w-full" />}
      {read.isError && (
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      )}
      {read.data?.tools.length === 0 && <p className="text-text-2">{NO_TOOLS_YET}</p>}
      <ul>
        {read.data?.tools.map((tool) => (
          <ToolRow key={tool.id} scope={scope} tool={tool} />
        ))}
      </ul>
    </AreaFrame>
  )
}
