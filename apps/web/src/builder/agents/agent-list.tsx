import type { AgentListed, CompanyId, ProjectId } from '@conexus/hub-api'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { BotIcon } from 'lucide-react'
import { useEffect } from 'react'
import { projectsPagedQuery } from '../../hub/projects/public.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Block, BlockSentence, blockRow } from '../../ui/block.tsx'
import { cn } from '../../ui/cn.ts'
import { PageTitle } from '../../ui/list.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { Page, PlaceName } from '../automations/public.ts'
import { toolsText } from '../conversation/public.ts'
import { NewAgent } from './new-agent.tsx'
import { agentsQuery } from './queries.ts'
import { StateStamp } from './rows.tsx'
import {
  ALL_PROJECTS,
  AREA_TITLE,
  FILTER_PROJECT,
  lastRunText,
  NO_AGENTS,
  NO_AGENTS_COMPANY,
  NO_AGENTS_IN_PROJECT,
} from './text.ts'

type Place = { companyId: CompanyId; projectId?: ProjectId }

function AgentRow(props: { companyId: CompanyId; agent: AgentListed; inicio: boolean }) {
  const { companyId, agent, inicio } = props
  return (
    <li>
      <Link
        to="/companies/$companyId/projects/$projectId/agents/$agentId"
        params={{ companyId, projectId: agent.projectId, agentId: agent.id }}
        className={cn(
          blockRow,
          'hover:bg-surface-3',
          inicio &&
            'h-auto min-h-row flex-wrap py-sm pointer-coarse:h-auto pointer-coarse:min-h-11',
        )}
      >
        <BotIcon aria-hidden="true" className="size-4 shrink-0 text-text-2" />
        <span className={cn('flex min-w-0 flex-1 flex-col', inicio && 'min-w-24')}>
          <span className="truncate">{agent.name}</span>
          {inicio && (
            <span className="truncate text-fact text-text-2">
              <PlaceName companyId={companyId} projectId={agent.projectId} />
              {' · '}
              {lastRunText(agent.lastRunAt, new Date())}
            </span>
          )}
        </span>
        {!inicio && (
          <>
            <span className="hidden min-w-0 flex-1 truncate text-text-2 sm:inline">
              {agent.description}
            </span>
            <span className="ml-auto shrink-0 text-fact text-text-2">{toolsText(agent.tools)}</span>
          </>
        )}
        {inicio ? (
          <span className="flex max-w-full flex-wrap gap-x-md gap-y-xs">
            <StateStamp state={agent.state} />
          </span>
        ) : (
          <StateStamp state={agent.state} />
        )}
      </Link>
    </li>
  )
}

/**
 * The agents (step 24.3, U5 and 24.3.1 U9): one component for the Projeto's area and the Início's
 * page, as the Automações. In a Projeto, its agents with what each does and its tools; at Início,
 * every live Projeto's, each with its Projeto, its state and when it last ran. `empty` replaces the
 * sentence of an empty list.
 */
export function AgentList(props: Place & { inicio?: boolean; empty?: string }) {
  const { companyId, projectId, inicio = false } = props
  const read = useQuery(agentsQuery(companyId, projectId))
  const phone = useIsMobile()
  const empty = props.empty ?? (projectId === undefined && inicio ? NO_AGENTS_COMPANY : NO_AGENTS)
  const rows = (
    <>
      {read.isPending && <Skeleton className="h-20 w-full" />}
      {read.isError && (
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      )}
      {read.data?.agents.length === 0 && <BlockSentence>{empty}</BlockSentence>}
      <ul>
        {read.data?.agents.map((agent) => (
          <AgentRow key={agent.id} companyId={companyId} agent={agent} inicio={inicio} />
        ))}
      </ul>
    </>
  )
  // The page's own title sits right above on a phone and at Início, so the block does not say it a second time.
  return phone || inicio ? (
    <section aria-label={AREA_TITLE} className="flex min-w-0 flex-col">
      {rows}
    </section>
  ) : (
    <Block title={AREA_TITLE}>{rows}</Block>
  )
}

const ALL = 'ALL'

/** The filter by Projeto: the Projetos of the company, whose choice is a value of the address. */
function ProjectFilter({ companyId, projectId }: Place) {
  const navigate = useNavigate()
  const read = useInfiniteQuery(projectsPagedQuery(companyId))
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = read
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])
  const projects = read.data?.pages.flatMap((page) => page.projects) ?? []
  const items = [
    { value: ALL, label: ALL_PROJECTS },
    ...projects.map((project) => ({ value: project.id, label: project.name })),
  ]
  return (
    <Select
      value={projectId ?? ALL}
      items={items}
      onValueChange={(next) => {
        const chosen = projects.find((project) => project.id === next)?.id
        void navigate({
          to: '/companies/$companyId/agents',
          params: { companyId },
          search: chosen === undefined ? {} : { projectId: chosen },
        })
      }}
    >
      <SelectTrigger aria-label={FILTER_PROJECT} className="sm:w-60">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * **Agentes** of the Início (step 24.3.1, U9, the founder's `V1`): every agent of the company to
 * look at, filtered by Projeto; the row opens the agent in its Projeto, and **Novo agente** asks
 * which Projeto, since no agent lives outside one.
 */
export function AgentsPage(props: Place) {
  const { companyId, projectId } = props
  return (
    <Page projectId={undefined} gap="xl">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <PageTitle>{AREA_TITLE}</PageTitle>
        <NewAgent companyId={companyId} />
      </div>
      <ProjectFilter companyId={companyId} projectId={projectId} />
      <AgentList
        companyId={companyId}
        projectId={projectId}
        inicio
        empty={projectId === undefined ? NO_AGENTS_COMPANY : NO_AGENTS_IN_PROJECT}
      />
    </Page>
  )
}
