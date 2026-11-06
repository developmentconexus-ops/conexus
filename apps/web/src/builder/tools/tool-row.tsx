import type { CompanyId, ProjectId, ToolSummary } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { HubFailure, writeFailureText } from '../../platform/hub.ts'
import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { TableCell, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { CodeBadge } from './code-version.tsx'
import { sendToolDeletion } from './queries.ts'
import { deleteWarning, EFFECT_TEXT, NOBODY_USES, readNames, UNCONFIRMED_DELETE } from './text.ts'
import { NewVersion } from './tool-page.tsx'

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
              params={{
                companyId: props.scope.companyId,
                projectId: agent.projectId,
                agentId: agent.id,
              }}
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

/** What the tool reads: a preset's one read by its name, a tool in code's reads by their names. */
function readText(tool: ToolSummary): string {
  return tool.kind === 'PRESET' ? tool.readLabel : readNames(tool.reads, tool.readLabels)
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
 * the effect and the agents move under the name. Once Apagar is refused for them the row keeps its
 * agents, and the refusal below links each one.
 */
export function ToolRow({ scope, tool }: { scope: Scope; tool: ToolSummary }) {
  const remove = useMutation(sendToolDeletion)
  const phone = useIsMobile()
  const [failure, setFailure] = useState<unknown>()
  const [confirming, setConfirming] = useState(false)
  const [versioning, setVersioning] = useState(false)
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
  const actions = (
    <>
      {tool.kind === 'PRESET' && (
        <Button
          size="sm"
          aria-label={`Nova versão de ${tool.slug}`}
          onClick={() => setVersioning(true)}
        >
          Nova versão
        </Button>
      )}
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
    </>
  )
  const users =
    tool.usedBy.length === 0 ? NOBODY_USES : tool.usedBy.map((one) => one.name).join(' · ')
  return (
    <>
      {tool.kind === 'PRESET' && (
        <NewVersion scope={scope} toolId={tool.id} open={versioning} onOpenChange={setVersioning} />
      )}
      <TableRow>
        <TableCell className="whitespace-normal px-sm">
          <Link
            to="/companies/$companyId/projects/$projectId/agents/tools/$toolId"
            params={{ ...scope, toolId: tool.id }}
            className="block wrap-anywhere font-medium hover:underline"
          >
            {tool.slug}
            {tool.kind === 'CODE' && <CodeBadge />}
          </Link>
          <span className="block text-fact text-text-2">{tool.description}</span>
          {phone && (
            <>
              <span className="mt-xs flex flex-wrap items-center gap-sm">
                <span className="text-fact text-text-2">v{tool.latest.number}</span>
                {actions}
              </span>
              <span className="block text-fact text-text-2">
                {tool.connectionName} · {readText(tool)} · {EFFECT_TEXT[tool.effect]}
              </span>
              <span className="block text-fact text-text-2">{users}</span>
            </>
          )}
        </TableCell>
        {!phone && (
          <>
            <TableCell className="whitespace-normal px-sm text-text-2">
              {tool.connectionName}
              <span className="block text-fact">{readText(tool)}</span>
            </TableCell>
            <TableCell className="px-sm text-text-2">
              <Effect tool={tool} />
            </TableCell>
            <TableCell className="whitespace-normal px-sm text-text-2">{users}</TableCell>
          </>
        )}
        {!phone && (
          <>
            <TableCell className="px-sm text-fact text-text-2">v{tool.latest.number}</TableCell>
            <TableCell className="px-sm">
              <span className="flex gap-xs">{actions}</span>
            </TableCell>
          </>
        )}
      </TableRow>
      {failure !== undefined && (
        <TableRow>
          <TableCell colSpan={phone ? 1 : 6} className="whitespace-normal px-sm py-sm">
            <Refused scope={scope} failure={failure} />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
