import type { AgentDetail, AgentId, CompanyId, ProjectId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import {
  BotIcon,
  BrainIcon,
  DatabaseIcon,
  GlobeIcon,
  PencilIcon,
  PlugIcon,
  WrenchIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Button, buttonVariants } from '../../ui/button.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { useConnectorCatalog } from '../assistant/public.ts'
import { modelLabel } from '../model-accounts/public.ts'
import { useOpenAgentConversation } from './open-conversation.ts'
import { publishFailureText, usePublish, usePublishLabel } from './publish.tsx'
import { agentQuery } from './queries.ts'
import { StateStamp } from './rows.tsx'
import {
  AGENT_GONE,
  connectionOf,
  DRAFT_CHANGED,
  DRAFT_PANEL,
  GONE_CONNECTION,
  memoryText,
  SAME_MODEL,
  toolTitle,
  WEB_TOOL,
} from './text.ts'
import { ToolChip } from './tool-chip.tsx'

type Scope = { companyId: CompanyId; projectId: ProjectId }

function Part(props: { icon: LucideIcon; title: string; children: ReactNode }) {
  const Icon = props.icon
  return (
    <section aria-label={props.title} className="flex flex-col gap-xs border-b border-line py-sm">
      <h3 className="flex items-center gap-sm font-body text-label font-semibold">
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        {props.title}
      </h3>
      {props.children}
    </section>
  )
}

function Filled({ scope, agent }: { scope: Scope; agent: AgentDetail }) {
  const catalog = useConnectorCatalog(scope.companyId)
  const { publish, pending } = usePublish(scope, agent.id)
  const test = useOpenAgentConversation(scope, agent.id)
  const [error, setError] = useState<string>()
  const label = usePublishLabel(scope, agent.id)
  const { draft } = agent

  async function asPublish() {
    setError(undefined)
    try {
      await publish(agent.revision, '')
    } catch (failure) {
      const moved = failure instanceof HubFailure && failure.code === 'AGENT_DRAFT_STALE'
      setError(moved ? DRAFT_CHANGED : publishFailureText(failure))
    }
  }

  return (
    <>
      <div className="flex min-w-0 items-center gap-sm border-b border-line px-md py-sm">
        <BotIcon aria-hidden="true" className="size-4 shrink-0" />
        <h2 className="min-w-0 flex-1 truncate font-display text-title">Rascunho · {agent.name}</h2>
        <StateStamp state={agent.state} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-auto px-md">
        <Part icon={PencilIcon} title="Instruções">
          <p className="line-clamp-3 whitespace-pre-wrap break-words text-text-2">
            {draft.instructions}
          </p>
        </Part>
        <Part icon={BrainIcon} title="Modelo">
          <p className="text-text-2">
            {draft.model === null ? SAME_MODEL : modelLabel(draft.model)}
          </p>
        </Part>
        <Part icon={DatabaseIcon} title="Memória">
          <p className="text-text-2">{memoryText(draft.memory)}</p>
        </Part>
        <Part icon={WrenchIcon} title="Ferramentas">
          <ul className="m-0 flex list-none flex-wrap gap-xs p-0">
            {agent.tools.map((tool) => (
              <ToolChip
                key={tool.id}
                tool={tool}
                title={toolTitle({ ...tool, description: tool.version.description }, agent.offered)}
                logo={catalog.logo(connectionOf(agent.offered, tool.connectionId)?.connector ?? '')}
              />
            ))}
            {draft.web && (
              <li className="flex items-center gap-xs rounded-control border border-line px-sm py-xs">
                <GlobeIcon aria-hidden="true" className="size-4" />
                {WEB_TOOL}
              </li>
            )}
          </ul>
        </Part>
        <Part icon={PlugIcon} title="Ligações">
          <ul className="m-0 flex list-none flex-col gap-xxs p-0 text-text-2">
            {draft.connections.map((id) => {
              const one = connectionOf(agent.offered, id)
              return (
                <li key={id}>
                  {one === undefined
                    ? GONE_CONNECTION
                    : `${catalog.name(one.connector)} · ${one.name}`}
                </li>
              )
            })}
          </ul>
        </Part>
      </div>
      <div className="flex flex-col gap-sm border-t border-line p-md">
        {(error ?? test.error) !== undefined && (
          <p role="alert" className="text-danger">
            {error ?? test.error}
          </p>
        )}
        <div className="flex flex-wrap gap-sm">
          <Button size="sm" disabled={test.pending} onClick={() => void test.open(true)}>
            Testar
          </Button>
          <Link
            to="/companies/$companyId/projects/$projectId/agents/$agentId"
            params={{ ...scope, agentId: agent.id }}
            className={buttonVariants({ size: 'sm' })}
          >
            Abrir a página
          </Link>
          <Button size="sm" variant="primary" disabled={pending} onClick={() => void asPublish()}>
            {pending ? 'Publicando…' : label}
          </Button>
        </div>
      </div>
    </>
  )
}

/**
 * The draft of the agent the Construtor saved, beside its conversation (step 24.3, criterion 26):
 * read live by its id, so it fills as the Construtor works. **Publicar** sends the `revision` it
 * showed, so a draft that moved since is refused with `AGENT_DRAFT_STALE`.
 */
export function DraftPanel(props: { scope: Scope; agentId: AgentId }) {
  const { scope, agentId } = props
  const live = useQuery(agentQuery(scope, agentId))
  const gone = live.error instanceof HubFailure && live.error.code === 'AGENT_NOT_FOUND'
  return (
    <section aria-label={DRAFT_PANEL} className="flex h-full min-h-0 flex-col bg-surface">
      {gone ? (
        <Empty>{AGENT_GONE}</Empty>
      ) : live.isError ? (
        <ReadFailure text={sentenceOf(live.error)} onRetry={() => void live.refetch()} />
      ) : live.data === undefined ? (
        <Skeleton className="m-md h-24" />
      ) : (
        <Filled scope={scope} agent={live.data.agent} />
      )}
    </section>
  )
}
