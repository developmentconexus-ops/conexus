import type {
  CompanyId,
  ProblemField,
  ProblemReason,
  ProjectId,
  ToolDetail,
  ToolId,
  ToolVersionConfig,
} from '@conexus/hub-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { Dialog, DialogContent } from '../../ui/dialog.tsx'
import { PageTitle } from '../../ui/list.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { AreaFrame, ToolForm } from '../agents/public.ts'
import { sendToolVersion, toolQuery } from './queries.ts'
import { BACK_TO_TOOLS, UNCONFIRMED_VERSION } from './text.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }

/** **Nova versão**: the form of the latest version, whose connection and read only show; it saves version `n + 1`. */
function NewVersion(props: {
  scope: Scope
  tool: ToolDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { scope, tool } = props
  const queryClient = useQueryClient()
  const save = useMutation(sendToolVersion)
  const attempt = useAttemptKey()
  const [error, setError] = useState<string>()
  const [refused, setRefused] = useState<{
    field: ProblemField | undefined
    reason: ProblemReason | undefined
  }>()
  const latest = tool.versions.find((one) => one.number === tool.latest.number)
  if (latest === undefined)
    throw new Error(`the tool ${tool.id} has no version ${tool.latest.number}`)

  async function send({ description, bound, open }: ToolVersionConfig) {
    setError(undefined)
    setRefused(undefined)
    try {
      const made = await attempt((attemptKey) =>
        save.mutateAsync({
          params: { ...scope, toolId: tool.id },
          body: { description, bound, open },
          attemptKey,
        }),
      )
      queryClient.setQueryData(toolQuery(scope, tool.id).queryKey, made)
      props.onOpenChange(false)
    } catch (failure) {
      if (failure instanceof HubFailure)
        setRefused({ field: failure.field, reason: failure.reason })
      setError(writeFailureText(failure, UNCONFIRMED_VERSION))
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent size="fields" title="Nova versão">
        <ToolForm
          offered={[]}
          fixed={{ ...tool, connection: tool.connectionName, read: tool.readLabel }}
          initial={latest}
          pending={save.isPending}
          refused={refused}
          error={error}
          submitLabel="Gravar versão"
          onCancel={() => props.onOpenChange(false)}
          onSubmit={(input) => void send(input)}
        />
      </DialogContent>
    </Dialog>
  )
}

/**
 * One tool of the library (step 24.3.1, U7, criterion 32): its versions, newest first, and **Nova
 * versão**; the agents that hold an earlier version keep it.
 */
export function ToolPage(props: Scope & { toolId: ToolId }) {
  const scope = { companyId: props.companyId, projectId: props.projectId }
  const read = useQuery(toolQuery(scope, props.toolId))
  const [open, setOpen] = useState(false)
  const tool = read.data?.tool

  return (
    <AreaFrame scope={scope} tab="ferramentas">
      <Link
        to="/companies/$companyId/projects/$projectId/agents/tools"
        params={scope}
        className="text-label text-text-2 hover:underline"
      >
        {BACK_TO_TOOLS}
      </Link>
      {read.isError && (
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      )}
      {tool !== undefined && (
        <>
          <PageTitle>{tool.slug}</PageTitle>
          <Button className="w-fit" variant="primary" onClick={() => setOpen(true)}>
            Nova versão
          </Button>
          <ul className="flex flex-col">
            {[...tool.versions]
              .sort((a, b) => b.number - a.number)
              .map((one) => (
                <li key={one.id} className="flex flex-col gap-xs border-b border-line px-sm py-sm">
                  <span className="font-semibold">Versão {one.number}</span>
                  <span>{one.description}</span>
                  <span className="text-fact text-text-2">
                    Valores fixos: {JSON.stringify(one.bound)} · O modelo preenche:{' '}
                    {one.open.length === 0 ? 'nada' : one.open.join(', ')}
                  </span>
                </li>
              ))}
          </ul>
          <NewVersion scope={scope} tool={tool} open={open} onOpenChange={setOpen} />
        </>
      )}
    </AreaFrame>
  )
}
