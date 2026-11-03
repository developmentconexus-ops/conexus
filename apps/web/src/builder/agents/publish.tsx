import type { AgentDetail, CompanyId, ProjectId } from '@conexus/hub-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { HubFailure, writeFailureText } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { Dialog, DialogContent, DialogFooter } from '../../ui/dialog.tsx'
import { Textarea } from '../../ui/textarea.tsx'
import { sendPublish, settleAgent, versionsQuery } from './queries.ts'
import { missingField, UNCONFIRMED_PUBLISH } from './text.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }

/** What a person reads for a refused publication: the field the draft lacks, or the failure's own sentence. */
export function publishFailureText(failure: unknown): string {
  if (failure instanceof HubFailure && failure.code === 'AGENT_DRAFT_INVALID') {
    return missingField(failure.field)
  }
  return writeFailureText(failure, UNCONFIRMED_PUBLISH)
}

/**
 * The label of **Publicar**: it names the number the next publication makes (one past the newest version,
 * the first when none is published) only once the versions are read, so it never promises a false one.
 */
export function usePublishLabel(scope: Scope, agentId: AgentDetail['id']): string {
  const versions = useQuery(versionsQuery(scope, agentId))
  if (versions.data === undefined) return 'Publicar'
  return `Publicar v${Math.max(0, ...versions.data.versions.map((one) => one.number)) + 1}`
}

/**
 * Publishes the draft at the revision the screen showed (criterion 27); the agent and the lists the
 * publication changes are read again.
 */
export function usePublish(scope: Scope, agentId: AgentDetail['id']) {
  const queryClient = useQueryClient()
  const send = useMutation(sendPublish)
  return {
    pending: send.isPending,
    async publish(revision: number, message: string) {
      const { agent } = await send.mutateAsync({
        params: { ...scope, agentId },
        body: { revision, message },
      })
      await settleAgent(queryClient, scope, agent)
    },
  }
}

/** **Publicar** of the page: asks the message of the version, then shows the version it made. */
export function PublishButton(props: { scope: Scope; agent: AgentDetail }) {
  const { agent } = props
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string>()
  const { publish, pending } = usePublish(props.scope, agent.id)
  const label = usePublishLabel(props.scope, agent.id)

  async function confirm() {
    setError(undefined)
    try {
      await publish(agent.revision, message.trim())
      setOpen(false)
      setMessage('')
    } catch (failure) {
      setError(publishFailureText(failure))
    }
  }

  return (
    <>
      <Button size="sm" variant="primary" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title={`Publicar ${agent.name}`}
          description="Diga o que mudou nesta versão. Uma conversa nova passa a falar com ela."
        >
          <Textarea
            aria-label="Mensagem da versão"
            value={message}
            maxLength={280}
            onChange={(event) => setMessage(event.target.value)}
          />
          {error !== undefined && (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="primary" disabled={pending} onClick={() => void confirm()}>
              {pending ? 'Publicando…' : 'Publicar versão'}
            </Button>
            <Button variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
