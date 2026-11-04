import type { CompanyId, ProjectId, ToolSummary } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { HubFailure, writeFailureText } from '../../platform/hub.ts'
import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { TableCell, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { sendToolDeletion } from './queries.ts'
import { deleteWarning, EFFECT_TEXT, NOBODY_USES, UNCONFIRMED_DELETE } from './text.ts'

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

function Effect({ tool }: { tool: ToolSummary }) {
  return (
    <span className="inline-flex items-center gap-xs">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-text-2" />
      {EFFECT_TEXT[tool.effect]}
    </span>
  )
}

/**
 * A tool of the library as a table row (prototype screen 4): its name with what it does, what it
 * reads and where, its effect, the agents that use it and its latest version. On a phone the read,
 * the effect and the agents move under the name. The agents are named by the refusal alone once
 * Apagar is refused for them, so they never show twice.
 */
export function ToolRow({ scope, tool }: { scope: Scope; tool: ToolSummary }) {
  const remove = useMutation(sendToolDeletion)
  const phone = useIsMobile()
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
    }
  }
  const users =
    failure instanceof HubFailure && failure.code === 'TOOL_IN_USE'
      ? null
      : tool.usedBy.length === 0
        ? NOBODY_USES
        : tool.usedBy.map((one) => one.name).join(', ')
  return (
    <>
      <TableRow>
        <TableCell className="whitespace-normal px-sm">
          <Link
            to="/companies/$companyId/projects/$projectId/agents/tools/$toolId"
            params={{ ...scope, toolId: tool.id }}
            className="block truncate font-medium hover:underline"
          >
            {tool.slug}
          </Link>
          <span className="block text-fact text-text-2">{tool.description}</span>
          {phone && (
            <span className="block text-fact text-text-2">
              Lê {tool.readLabel} em {tool.connectionName} · {EFFECT_TEXT[tool.effect]}
              {users !== null && ` · ${users}`}
            </span>
          )}
        </TableCell>
        {!phone && (
          <>
            <TableCell className="whitespace-normal px-sm text-text-2">
              {tool.connectionName}
              <span className="block text-fact">{tool.readLabel}</span>
            </TableCell>
            <TableCell className="px-sm text-text-2">
              <Effect tool={tool} />
            </TableCell>
            <TableCell className="whitespace-normal px-sm text-text-2">{users}</TableCell>
          </>
        )}
        <TableCell className="px-sm text-fact text-text-2">v{tool.latest.number}</TableCell>
        <TableCell className="px-sm text-right">
          <Button
            size="sm"
            variant="danger"
            aria-label={`Apagar ${tool.slug}`}
            disabled={remove.isPending}
            onClick={() => setConfirming(true)}
          >
            Apagar
          </Button>
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
        </TableCell>
      </TableRow>
      {failure !== undefined && (
        <TableRow>
          <TableCell colSpan={phone ? 3 : 6} className="whitespace-normal px-sm py-sm">
            <Refused scope={scope} failure={failure} />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
