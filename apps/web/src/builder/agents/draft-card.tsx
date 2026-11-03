import type { CompanyId, ConstrutorResult, ProjectId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { HubFailure, sentenceOfCode } from '../../platform/hub.ts'
import { Button, buttonVariants } from '../../ui/button.tsx'
import { useConnectorCatalog } from '../assistant/public.ts'
import { publishFailureText, usePublish } from './publish.tsx'
import { agentQuery } from './queries.ts'
import { StateStamp } from './rows.tsx'
import { AGENT_GONE, DRAFT_CHANGED, toolsText } from './text.ts'

/**
 * The card of the draft in the Construtor's conversation (step 24.3, U5, criterion 26): what
 * `agent_draft` and `agent_set` answered, as the person reads it: the name, what it does, what it
 * reads and its state, with **Abrir** and **Publicar**. **Publicar** sends the `revision` the card
 * showed, so a draft that moved since is refused with `AGENT_DRAFT_STALE`, and the person opens it.
 */
export function DraftCard(props: {
  companyId: CompanyId
  projectId: ProjectId
  result: ConstrutorResult
}) {
  const { result } = props
  if (result.kind === 'REFUSED') {
    return <p className="text-text-2">{sentenceOfCode(result.code)}</p>
  }
  return <Saved {...props} saved={result.agent} />
}

function Saved(props: {
  companyId: CompanyId
  projectId: ProjectId
  saved: Extract<ConstrutorResult, { kind: 'SAVED' }>['agent']
}) {
  const { saved } = props
  const catalog = useConnectorCatalog(props.companyId)
  const scope = { companyId: props.companyId, projectId: props.projectId }
  const live = useQuery(agentQuery(scope, saved.id))
  const { publish, pending } = usePublish(scope, saved.id)
  const [error, setError] = useState<string>()
  const gone = live.error instanceof HubFailure && live.error.code === 'AGENT_NOT_FOUND'
  const state = live.data?.agent.state ?? saved.state
  const reads = saved.offered
    .filter((one) => saved.draft.connections.includes(one.connectionId))
    .map((one) => `${catalog.name(one.connector)} · ${one.name}`)
  const tools = saved.tools.length === 0 ? [] : [toolsText(saved.tools.length)]

  async function asPublish() {
    setError(undefined)
    try {
      await publish(saved.revision, '')
    } catch (failure) {
      const moved = failure instanceof HubFailure && failure.code === 'AGENT_DRAFT_STALE'
      setError(moved ? DRAFT_CHANGED : publishFailureText(failure))
    }
  }

  return (
    <div className="flex flex-col items-start gap-sm rounded-card border border-line bg-surface p-md">
      <p className="font-display text-title">{saved.name}</p>
      {gone ? (
        <p className="text-text-2">{AGENT_GONE}</p>
      ) : (
        <>
          <StateStamp state={state} />
          {saved.description !== '' && <p className="break-words text-text">{saved.description}</p>}
          {(reads.length > 0 || tools.length > 0) && (
            <p className="break-words text-text-2">Lê: {[...reads, ...tools].join(' · ')}</p>
          )}
          {error !== undefined && (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-sm">
            <Link
              to="/companies/$companyId/projects/$projectId/agents/$agentId"
              params={{ ...scope, agentId: saved.id }}
              className={buttonVariants({ size: 'sm' })}
            >
              Abrir
            </Link>
            <Button size="sm" variant="primary" disabled={pending} onClick={() => void asPublish()}>
              {pending ? 'Publicando…' : 'Publicar'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
