import type { AssistantConversation, CompanyId, ProposedAutomation } from '@conexus/hub-api'
import { automationPath } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { derivedAttemptKey } from '../../platform/attempt-key.ts'
import { writeFailureText } from '../../platform/hub.ts'
import { Button, buttonVariants } from '../../ui/button.tsx'
import { cadenceText } from './cadence-text.ts'
import { PlaceName } from './place.tsx'
import { sendAutomationCreation } from './queries.ts'
import { CREATED, UNCONFIRMED_CREATION } from './text.ts'

type Created = { path: string }

/**
 * **Criar automação** (step 24.2, U3, `E1`): the automation the Assistant proposed, with the place
 * of the conversation. The key of the attempt derives from the conversation and the call, which
 * Mastra stored with the message, so a reload and a second touch create one automation (code C37,
 * web W24); nothing is made before the touch.
 */
export function ProposalCard(props: {
  companyId: CompanyId
  conversation: Pick<AssistantConversation, 'id' | 'projectId' | 'connections'>
  proposed: ProposedAutomation
  /** The call of `propose_automation` this card draws. */
  toolCallId: string
}) {
  const { companyId, conversation, proposed } = props
  const [created, setCreated] = useState<Created>()
  const [error, setError] = useState<string>()
  const inFlight = useRef(false)
  const send = useMutation(sendAutomationCreation)
  const names = proposed.connections.flatMap(
    (id) => conversation.connections.find((each) => each.connectionId === id)?.name ?? [],
  )

  async function create() {
    if (inFlight.current) return
    inFlight.current = true
    setError(undefined)
    try {
      const attemptKey = await derivedAttemptKey(`${conversation.id}:${props.toolCallId}`)
      const { automation } = await send.mutateAsync({
        params: { companyId },
        body: {
          name: proposed.name,
          prompt: proposed.prompt,
          cadence: proposed.cadence,
          projectId: conversation.projectId ?? undefined,
          connections: proposed.connections,
        },
        attemptKey,
      })
      setCreated({ path: automationPath(companyId, automation.projectId, automation.id) })
    } catch (failure) {
      setError(writeFailureText(failure, UNCONFIRMED_CREATION))
    } finally {
      inFlight.current = false
    }
  }

  return (
    <div className="flex flex-col items-start gap-sm rounded-card border border-line bg-surface p-md">
      <p className="font-display text-title">{proposed.name}</p>
      <p className="text-text-2">
        {cadenceText(proposed.cadence)} ·{' '}
        <PlaceName companyId={companyId} projectId={conversation.projectId} />
        {names.length > 0 && ` · ${names.join(', ')}`}
      </p>
      <p className="whitespace-pre-wrap break-words text-text">{proposed.prompt}</p>
      {created === undefined ? (
        <Button variant="primary" disabled={send.isPending} onClick={() => void create()}>
          {send.isPending ? 'Criando…' : 'Criar automação'}
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-md">
          <p role="status" className="text-success">
            {CREATED}
          </p>
          <Link to={created.path} className={buttonVariants()}>
            Ver automação
          </Link>
        </div>
      )}
      {error !== undefined && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
