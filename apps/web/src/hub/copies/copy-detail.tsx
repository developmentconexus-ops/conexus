import type { CompanyId, CopyId, CopyRun, CopySummary } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronRightIcon } from 'lucide-react'
import { Fragment } from 'react'
import { dayAndHour } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { List, PageTitle, Row } from '../../ui/list.tsx'
import { Pager } from '../../ui/pager.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { ConnectorLogo, connectionsQuery, connectorName } from '../connectors/public.ts'
import { ColumnsTab, DetailsPanel, OverviewTab } from './copy-facts.tsx'
import { CopyMenu, NoteLine, RunNowButton, StateBadge, useNote } from './copy-list.tsx'
import { CopySample } from './copy-sample.tsx'
import { copyRunsQuery } from './queries.ts'
import { useRunRequests } from './run-requests.ts'
import { TableTab } from './search.ts'
import {
  COLUMNS_TITLE,
  CRUMBS_LABEL,
  copiedText,
  countText,
  DATA_TITLE,
  durationText,
  inactiveNotice,
  NO_RUNS_YET,
  OVERVIEW_TITLE,
  outcomeText,
  RUNS_TITLE,
  SAMPLE_TITLE,
  SEE_RUN,
  WHOLE_PASS,
} from './text.ts'

function RunRow({ run }: { run: CopyRun }) {
  return (
    <TableRow>
      <TableCell className="tabular-nums">{dayAndHour(run.startedAt)}</TableCell>
      <TableCell className="tabular-nums">{durationText(run)}</TableCell>
      <TableCell className="text-right tabular-nums">{countText(run.read)}</TableCell>
      <TableCell className="text-right tabular-nums">{countText(run.written)}</TableCell>
      <TableCell className="whitespace-normal">
        {outcomeText(run)}
        {run.whole && <span className="text-text-2"> · {WHOLE_PASS}</span>}
      </TableCell>
    </TableRow>
  )
}

/** A run on a phone, as the card draws it: when and how long, then what was read and how it ended. */
function RunPhoneRow({ run }: { run: CopyRun }) {
  return (
    <Row>
      <div className="flex min-w-0 flex-col gap-xs px-sm py-md tabular-nums">
        <span>{`${dayAndHour(run.startedAt)} · ${durationText(run)}`}</span>
        <span className="break-words text-text-2">
          {`${countText(run.read)} lidas · ${countText(run.written)} gravadas · ${outcomeText(run)}${run.whole ? ` · ${WHOLE_PASS}` : ''}`}
        </span>
      </div>
    </Row>
  )
}

function Runs(props: {
  runs: CopyRun[]
  next: Parameters<typeof Pager>[0]['next']
  page?: string
}) {
  const phone = useIsMobile()
  if (props.runs.length === 0) return <p className="text-text-2">{NO_RUNS_YET}</p>
  const pager = <Pager next={props.next} param="page" page={props.page} list="Rodadas" />
  if (phone) {
    return (
      <>
        <List>
          {props.runs.map((run) => (
            <RunPhoneRow key={run.id} run={run} />
          ))}
        </List>
        {pager}
      </>
    )
  }
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quando</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead className="text-right">Lidas</TableHead>
            <TableHead className="text-right">Gravadas</TableHead>
            <TableHead>Resultado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.runs.map((run) => (
            <RunRow key={run.id} run={run} />
          ))}
        </TableBody>
      </Table>
      {pager}
    </>
  )
}

/** The columns the source stopped sending, as the notice on top of the page names them: the day is the earliest. */
function inactiveOf(copy: CopySummary) {
  const stopped = copy.shown.columns.flatMap((column) =>
    column.inactiveSince === null ? [] : [{ name: column.name, since: column.inactiveSince }],
  )
  const since = stopped.map((one) => one.since).sort()[0]
  return since === undefined ? undefined : { names: stopped.map((one) => one.name), since }
}

/**
 * **A tabela** (Dados, parte 1; web W29, W34): the path, the system's logo, the name and state and
 * the line of when it was last copied on top, then a bar with the tabs **Visão geral** (the one it
 * opens on), **Colunas**, **Amostra** (for whoever may read rows) and **Rodadas**, the tab in the
 * address, and under it the tab beside the panel **Detalhes**. A column the source stopped sending
 * is told on top. The route's loader has already refused a copy the Hub does not have.
 */
export function CopyDetail(props: {
  companyId: CompanyId
  copyId: CopyId
  tab: TableTab | undefined
  page?: string
  q?: string
}) {
  const { companyId, copyId, page, q } = props
  const requests = useRunRequests()
  const read = useQuery(copyRunsQuery(companyId, copyId, page, requests))
  const connections = useQuery(connectionsQuery(companyId))
  const navigate = useNavigate()
  const [note, setNote] = useNote(read.data === undefined ? [] : [read.data.copy])
  if (read.isPending || connections.isPending) return <Skeleton className="h-24 w-full" />
  if (connections.isError) {
    return (
      <ReadFailure
        text={sentenceOf(connections.error)}
        onRetry={() => void connections.refetch()}
      />
    )
  }
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  const { copy, runs, next } = read.data
  const tab = props.tab ?? TableTab.enum.overview
  const connector = copy.sources[0]?.connection.connector ?? ''
  const system = connectorName(connections.data.connectors, connector)
  const entry = connections.data.connectors.find((one) => one.id === connector)
  const inactive = inactiveOf(copy)
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-lg">
      <nav
        aria-label={CRUMBS_LABEL}
        className="flex min-w-0 flex-wrap items-center gap-xs text-label text-text-2"
      >
        {[DATA_TITLE, system].map((name) => (
          <Fragment key={name}>
            <Link
              to="/companies/$companyId/data"
              params={{ companyId }}
              search={{ q }}
              activeOptions={{ exact: true }}
            >
              {name}
            </Link>
            <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0" />
          </Fragment>
        ))}
        <span className="min-w-0 break-words font-mono text-fact text-text">{copy.name}</span>
      </nav>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-md">
        <div className="flex min-w-0 flex-wrap items-center gap-md">
          {entry !== undefined && <ConnectorLogo entry={entry} />}
          <PageTitle className="min-w-0 break-words font-mono">{copy.name}</PageTitle>
          <StateBadge copy={copy} />
        </div>
        <div className="flex items-center gap-sm">
          <RunNowButton companyId={companyId} copy={copy} onNote={setNote} />
          <CopyMenu
            companyId={companyId}
            copy={copy}
            onNote={setNote}
            withRun={false}
            onDeleted={() =>
              void navigate({ to: '/companies/$companyId/data', params: { companyId } })
            }
          />
        </div>
      </div>
      <p className="text-text-2 tabular-nums">{copiedText(system, copy)}</p>
      {note !== undefined && <NoteLine note={note} />}
      {inactive !== undefined && (
        <div className="flex flex-wrap items-baseline gap-md">
          <Alert tone="danger">{inactiveNotice(system, inactive.names, inactive.since)}</Alert>
          <Link
            to="."
            search={(old) => ({ ...old, tab: TableTab.enum.runs })}
            className="underline"
          >
            {SEE_RUN}
          </Link>
        </div>
      )}
      <Tabs
        value={tab}
        className="min-w-0"
        onValueChange={(next) => {
          const chosen = TableTab.safeParse(next)
          if (chosen.success) {
            void navigate({
              to: '.',
              search: (old) => ({ ...old, tab: chosen.data, page: undefined }),
            })
          }
        }}
      >
        <TabsList aria-label="Tabela" className="w-full max-w-full flex-wrap border-b border-line">
          <TabsTrigger value={TableTab.enum.overview}>{OVERVIEW_TITLE}</TabsTrigger>
          <TabsTrigger value={TableTab.enum.columns}>
            {COLUMNS_TITLE}{' '}
            <span className="text-text-2 tabular-nums">{copy.shown.columns.length}</span>
          </TabsTrigger>
          <TabsTrigger value={TableTab.enum.sample}>{SAMPLE_TITLE}</TabsTrigger>
          <TabsTrigger value={TableTab.enum.runs}>{RUNS_TITLE}</TabsTrigger>
        </TabsList>
        <div className="flex min-w-0 flex-col gap-lg md:flex-row">
          <div className="min-w-0 flex-1">
            <TabsContent value={TableTab.enum.overview} className="pt-md">
              <OverviewTab copy={copy} />
            </TabsContent>
            <TabsContent value={TableTab.enum.columns} className="pt-md">
              <ColumnsTab copy={copy} />
            </TabsContent>
            <TabsContent value={TableTab.enum.sample} className="pt-md">
              <CopySample companyId={companyId} copyId={copyId} columns={copy.shown.columns} />
            </TabsContent>
            <TabsContent value={TableTab.enum.runs} className="pt-md">
              <Runs runs={runs} next={next} page={page} />
            </TabsContent>
          </div>
          <DetailsPanel copy={copy} system={system} entry={entry} />
        </div>
      </Tabs>
    </div>
  )
}
