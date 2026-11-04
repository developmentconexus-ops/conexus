import type { AgentListed, CompanyId, ProjectId } from '@conexus/hub-api'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { BotIcon } from 'lucide-react'
import { projectsPagedQuery } from '../../hub/projects/public.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
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
  MORE_PROJECTS,
  NO_AGENTS,
  NO_AGENTS_COMPANY,
  NO_AGENTS_IN_PROJECT,
} from './text.ts'

type Place = { companyId: CompanyId; projectId?: ProjectId }

/** A row of the Projeto's area, as it was before the Início had a list: what the agent does and its tools. */
function AreaRow(props: { companyId: CompanyId; agent: AgentListed }) {
  const { companyId, agent } = props
  return (
    <li>
      <Link
        to="/companies/$companyId/projects/$projectId/agents/$agentId"
        params={{ companyId, projectId: agent.projectId, agentId: agent.id }}
        className={`${blockRow} hover:bg-surface-3`}
      >
        <BotIcon aria-hidden="true" className="size-4 shrink-0 text-text-2" />
        <span className="max-w-[45%] shrink-0 truncate">{agent.name}</span>
        <span className="hidden min-w-0 flex-1 truncate text-text-2 sm:inline">
          {agent.description}
        </span>
        <span className="ml-auto shrink-0 text-fact text-text-2">{toolsText(agent.tools)}</span>
        <StateStamp state={agent.state} />
      </Link>
    </li>
  )
}

/**
 * A row of the Início: the agent, its Projeto and when it last ran, then its state. The Projeto's
 * name truncates and the last run is never cut: where the two do not fit on a line, it takes the next.
 */
function InicioRow(props: { companyId: CompanyId; agent: AgentListed }) {
  const { companyId, agent } = props
  return (
    <li>
      <Link
        to="/companies/$companyId/projects/$projectId/agents/$agentId"
        params={{ companyId, projectId: agent.projectId, agentId: agent.id }}
        className={cn(
          blockRow,
          'h-auto min-h-row flex-wrap py-sm hover:bg-surface-3 pointer-coarse:h-auto pointer-coarse:min-h-11',
        )}
      >
        <BotIcon aria-hidden="true" className="size-4 shrink-0 text-text-2" />
        <span className="flex min-w-24 flex-1 flex-col">
          <span className="truncate">{agent.name}</span>
          <span className="flex flex-wrap gap-x-xs text-fact text-text-2">
            <span className="max-w-full truncate">
              <PlaceName companyId={companyId} projectId={agent.projectId} />
            </span>
            <span>· {lastRunText(agent.lastRunAt, new Date())}</span>
          </span>
        </span>
        <span className="flex max-w-full flex-wrap gap-x-md gap-y-xs">
          <StateStamp state={agent.state} />
        </span>
      </Link>
    </li>
  )
}

/**
 * The agents (step 24.3, U5 and 24.3.1 U9): one component for the Projeto's area and the Início's
 * page, as the Automações. In a Projeto, its agents with what each does and its tools; at Início,
 * every live Projeto's, each with its Projeto, its state and when it last ran.
 */
export function AgentList(props: Place & { inicio?: boolean }) {
  const { companyId, projectId, inicio = false } = props
  const read = useQuery(agentsQuery(companyId, projectId))
  const phone = useIsMobile()
  const empty = !inicio
    ? NO_AGENTS
    : projectId === undefined
      ? NO_AGENTS_COMPANY
      : NO_AGENTS_IN_PROJECT
  const Row = inicio ? InicioRow : AreaRow
  const rows = (
    <>
      {read.isPending && <Skeleton className="h-20 w-full" />}
      {read.isError && (
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      )}
      {read.data?.agents.length === 0 && <BlockSentence>{empty}</BlockSentence>}
      <ul>
        {read.data?.agents.map((agent) => (
          <Row key={agent.id} companyId={companyId} agent={agent} />
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
const MORE = 'MORE'

/** The filter by Projeto: the Projetos of the company, whose choice is a value of the address. */
function ProjectFilter({ companyId, projectId }: Place) {
  const navigate = useNavigate()
  const read = useInfiniteQuery(projectsPagedQuery(companyId))
  const projects = read.data?.pages.flatMap((page) => page.projects) ?? []
  const items = [
    { value: ALL, label: ALL_PROJECTS },
    ...projects.map((project) => ({ value: project.id, label: project.name })),
    ...(read.hasNextPage ? [{ value: MORE, label: MORE_PROJECTS }] : []),
  ]
  return (
    <>
      <Select
        value={projectId ?? ALL}
        items={items}
        onValueChange={(next) => {
          if (next === MORE) {
            void read.fetchNextPage()
            return
          }
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
      {read.isError && <Alert tone="danger">{sentenceOf(read.error)}</Alert>}
    </>
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
      <AgentList companyId={companyId} projectId={projectId} inicio />
    </Page>
  )
}
