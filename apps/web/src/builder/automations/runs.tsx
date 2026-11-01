import type { AutomationId, AutomationRun, CompanyId, ProjectId } from '@conexus/hub-api'
import { conversationPath, phraseOf } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { dayAndHour } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Badge } from '../../ui/badge.tsx'
import { buttonVariants } from '../../ui/button.tsx'
import { List, PageTitle, Row } from '../../ui/list.tsx'
import { Pager } from '../../ui/pager.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Actions, ScheduleLine, StateBadge } from './automations.tsx'
import { automationOf } from './loader.ts'
import { Page } from './page.tsx'
import { PlaceName, readNames } from './place.tsx'
import { automationRunsQuery, automationsQuery } from './queries.ts'
import {
  BACK_TO_AUTOMATIONS,
  NO_RUNS,
  NOT_RUN,
  OPEN_CONVERSATION,
  SKIPPED_BECAUSE,
} from './text.ts'

type Opened = { companyId: CompanyId; projectId: ProjectId | null }

/** How a run stands, in the words of the state matrix: a state word (design V35), and, failed or not run, why. */
function Outcome({ run }: { run: AutomationRun }) {
  const { state } = run
  switch (state.kind) {
    case 'RUNNING':
      return <Badge tone="warning">Rodando</Badge>
    case 'DONE':
      return <Badge tone="success">Pronta</Badge>
    case 'FAILED':
      return (
        <>
          <Badge tone="danger">Falhou</Badge>
          <span className="text-text-2">{phraseOf(state.code)}</span>
        </>
      )
    case 'SKIPPED':
      return (
        <>
          <Badge>{NOT_RUN}</Badge>
          <span className="text-text-2">{SKIPPED_BECAUSE}</span>
        </>
      )
  }
}

function RunRow({ run, opened }: { run: AutomationRun; opened: Opened }) {
  const conversationId = run.state.kind === 'SKIPPED' ? null : run.state.conversationId
  return (
    <Row>
      <div className="flex flex-wrap items-center gap-x-md gap-y-xs px-sm py-md">
        <span className="text-text-2">{dayAndHour(run.firedAt)}</span>
        <span>{run.trigger === 'SCHEDULED' ? 'Horário' : 'Manual'}</span>
        <Outcome run={run} />
        {conversationId !== null && (
          <Link
            to={conversationPath(opened.companyId, opened.projectId, conversationId)}
            className={buttonVariants({ size: 'sm' })}
          >
            {OPEN_CONVERSATION}
          </Link>
        )}
      </div>
    </Row>
  )
}

function Runs(props: {
  opened: Opened
  automationId: AutomationId
  page: string | undefined
  none: string
}) {
  const { opened, automationId, page } = props
  const read = useQuery(automationRunsQuery(opened.companyId, automationId, page))
  if (read.isPending) return <Skeleton className="h-20 w-full" />
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  const { runs, next } = read.data
  if (runs.length === 0) return <p className="text-text-2">{props.none}</p>
  return (
    <>
      <List>
        {runs.map((run) => (
          <RunRow key={run.runId} run={run} opened={opened} />
        ))}
      </List>
      <Pager next={next} param="page" page={page} list="Execuções" />
    </>
  )
}

/**
 * The history of one automation (criterion 19; web W29, W34): what it is, its actions and its runs,
 * newest first. The Hub keeps no read of one automation, so its header is its row of the place's
 * list (`automationOf`; the route's loader has already refused one the place does not list).
 */
export function AutomationRuns(props: {
  companyId: CompanyId
  automationId: AutomationId
  projectId?: ProjectId
  page?: string
}) {
  const { companyId, automationId, projectId } = props
  const read = useQuery(automationsQuery(companyId, projectId))
  const navigate = useNavigate()
  if (read.isPending) return <Skeleton className="h-24 w-full" />
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  const automation = automationOf(read.data.automations, automationId)
  const opened = { companyId, projectId: projectId ?? null }
  const reads = readNames(automation)
  function leave() {
    return projectId === undefined
      ? navigate({ to: '/companies/$companyId/automations', params: { companyId } })
      : navigate({
          to: '/companies/$companyId/projects/$projectId/automations',
          params: { companyId, projectId },
        })
  }
  return (
    <Page projectId={projectId} gap="lg">
      <div>
        {projectId === undefined ? (
          <Link
            to="/companies/$companyId/automations"
            params={{ companyId }}
            className="inline-flex items-center gap-xs text-label text-text-2"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
            {BACK_TO_AUTOMATIONS}
          </Link>
        ) : (
          <Link
            to="/companies/$companyId/projects/$projectId/automations"
            params={{ companyId, projectId }}
            className="inline-flex items-center gap-xs text-label text-text-2"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
            {BACK_TO_AUTOMATIONS}
          </Link>
        )}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-md">
        <PageTitle className="min-w-0 break-words">{automation.name}</PageTitle>
        <StateBadge state={automation.state} />
      </div>
      <p className="text-text-2">
        <ScheduleLine automation={automation} />
        {' · '}
        <PlaceName companyId={companyId} projectId={projectId ?? null} />
        {reads !== '' && ` · ${reads}`}
      </p>
      <p className="whitespace-pre-wrap break-words">{automation.prompt}</p>
      <Actions companyId={companyId} automation={automation} onDeleted={() => void leave()} />
      <Runs
        opened={opened}
        automationId={automationId}
        page={props.page}
        none={
          automation.state === 'ACTIVE' && automation.nextRunAt !== null
            ? `${NO_RUNS} Próxima: ${dayAndHour(automation.nextRunAt)}.`
            : NO_RUNS
        }
      />
    </Page>
  )
}
