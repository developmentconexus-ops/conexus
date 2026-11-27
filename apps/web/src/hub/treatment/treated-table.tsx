import type {
  CompanyId,
  TableRef,
  TreatedTable,
  TreatmentModel,
  TreatmentModelId,
} from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { HubFailure } from '../../platform/hub.ts'
import { Badge } from '../../ui/badge.tsx'
import { Fact } from '../../ui/fact.tsx'
import { List, PageTitle, Row } from '../../ui/list.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, NotFound, ReadFailure } from '../../ui/states.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs.tsx'
import { Approve, Reads, Sql } from './approve.tsx'
import { useMay } from './may.ts'
import { ProposeChange } from './new-treatment.tsx'
import { copiedTablesQuery, treatmentModelQuery, useTreatedTables } from './queries.ts'
import {
  ACTIVE,
  activeLine,
  BACK_TO_DATA,
  LAST_RUN,
  NO_ACCESS,
  NO_ACTIVE,
  NO_READER,
  NOT_HERE_ANYMORE,
  NOTHING_READ,
  PROPOSAL,
  READ_FAILED,
  refText,
  runText,
  TABS,
  versionLine,
} from './text.ts'
import type { Treated } from './treated-columns.tsx'
import { Columns } from './treated-columns.tsx'

const treatedRoute = getRouteApi('/_app/companies/$companyId/data/treated/$name')
const businessRoute = getRouteApi('/_app/companies/$companyId/data/business/$modelId')

type Layer = 'treated' | 'business'

function Back(props: { companyId: CompanyId; layer: Layer }) {
  return (
    <Link
      to="/companies/$companyId/data"
      params={{ companyId: props.companyId }}
      search={{ layer: props.layer }}
      className="inline-flex w-fit items-center gap-xs text-text-2 underline underline-offset-2"
    >
      <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
      {BACK_TO_DATA}
    </Link>
  )
}

const LINK = 'underline-offset-2 hover:underline'

/** A table a SQL reads, as a link to its page when the Hub lists it, plain text when it does not. */
function RefLink(props: { companyId: CompanyId; to: TableRef }) {
  const { companyId } = props
  const { layer, table } = props.to
  const copied = useQuery(copiedTablesQuery(companyId))
  const treated = useTreatedTables(companyId)
  const labelled = treated.data?.tables.find(
    (one): one is Treated => one.layer === 'tratado' && one.name === table,
  )
  const text = refText(props.to, labelled?.label ?? null)
  if (layer === 'tratado') {
    return (
      <Link
        to="/companies/$companyId/data/treated/$name"
        params={{ companyId, name: table }}
        className={LINK}
      >
        {text}
      </Link>
    )
  }
  if (layer === 'current') {
    const copy = copied.data?.find((one) => one.name === table)
    if (copy === undefined) return text
    return (
      <Link
        to="/companies/$companyId/data/lake/$tableId"
        params={{ companyId, tableId: copy.id }}
        className={LINK}
      >
        {text}
      </Link>
    )
  }
  const model = treated.data?.tables.find((one) => one.layer === 'negocio' && one.name === table)
  if (model?.layer !== 'negocio') return text
  return (
    <Link
      to="/companies/$companyId/data/business/$modelId"
      params={{ companyId, modelId: model.id }}
      className={LINK}
    >
      {text}
    </Link>
  )
}

function Refs(props: { companyId: CompanyId; refs: readonly TableRef[]; none: string }) {
  if (props.refs.length === 0) return <Empty>{props.none}</Empty>
  return (
    <List>
      {props.refs.map((ref) => (
        <Row key={`${ref.layer}.${ref.table}`}>
          <div className={`px-sm py-md text-fact ${ref.layer === 'tratado' ? '' : 'font-mono'}`}>
            <RefLink companyId={props.companyId} to={ref} />
          </div>
        </Row>
      ))}
    </List>
  )
}

function Tabbed(props: {
  names: readonly (keyof typeof TABS)[]
  panels: Record<string, ReactNode>
}) {
  const [first] = props.names
  return (
    <Tabs compact defaultValue={first}>
      <div className="overflow-x-auto border-b border-line">
        <TabsList>
          {props.names.map((name) => (
            <TabsTrigger key={name} value={name}>
              {TABS[name]}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {props.names.map((name) => (
        <TabsContent key={name} value={name} className="mt-md">
          {props.panels[name]}
        </TabsContent>
      ))}
    </Tabs>
  )
}

/** The tabs while the page loads: the strip of tabs and the body under it. */
function TabsSkeleton() {
  return (
    <div className="flex flex-col gap-md">
      <div className="flex gap-md border-b border-line pb-sm">
        {[0, 1, 2, 3].map((tab) => (
          <Skeleton key={tab} className="h-6 w-20" />
        ))}
      </div>
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

function Gate(props: { children: ReactNode }) {
  return useMay().proposeTreatment ? (
    <div className="mx-auto flex w-full max-w-page flex-col gap-xl">{props.children}</div>
  ) : (
    <p className="font-medium">{NO_ACCESS}</p>
  )
}

function TreatedBody(props: { companyId: CompanyId; table: Treated }) {
  const { companyId, table } = props
  return (
    <>
      <div className="flex flex-col gap-xs">
        <PageTitle className="break-words">{table.label}</PageTitle>
        <span className="wrap-anywhere font-mono text-fact text-text-2">{table.name}</span>
        {table.description !== '' && <p className="text-text-2">{table.description}</p>}
      </div>
      <Tabbed
        names={['overview', 'columns', 'from', 'readBy']}
        panels={{
          overview: (
            <dl className="flex flex-col">
              <Fact label={LAST_RUN}>
                <span
                  className={
                    table.lastRun?.status === 'FAILED' ? 'text-danger-text' : 'tabular-nums'
                  }
                >
                  {runText(table.lastRun)}
                </span>
              </Fact>
            </dl>
          ),
          columns: <Columns table={table} />,
          from: (
            <Refs
              companyId={companyId}
              refs={[{ layer: 'current', table: table.name }]}
              none={NOTHING_READ}
            />
          ),
          readBy: <Refs companyId={companyId} refs={table.readBy} none={NO_READER} />,
        }}
      />
    </>
  )
}

/** One treated table of a system: its last run and the Colunas, De onde vem and Quem lê tabs. */
export function TreatedTablePage() {
  const { companyId, name } = treatedRoute.useParams()
  const treated = useTreatedTables(companyId)
  const table = treated.data?.tables.find(
    (one): one is Treated => one.layer === 'tratado' && one.name === name,
  )
  return (
    <Gate>
      <Back companyId={companyId} layer="treated" />
      {treated.isPending && <TabsSkeleton />}
      {treated.isError && <ReadFailure text={READ_FAILED} onRetry={() => void treated.refetch()} />}
      {treated.isSuccess && table === undefined && <Empty>{NOT_HERE_ANYMORE}</Empty>}
      {table !== undefined && <TreatedBody companyId={companyId} table={table} />}
    </Gate>
  )
}

type Model = Extract<TreatedTable, { layer: 'negocio' }>

function ModelBody(props: {
  companyId: CompanyId
  modelId: TreatmentModelId
  data: TreatmentModel
  entry: Model | undefined
}) {
  const { companyId, modelId, data, entry } = props
  const may = useMay()
  const { active, proposal } = data
  const shown = active ?? proposal
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div className="flex min-w-0 flex-col gap-xs">
          <PageTitle className="break-words">
            <span className="font-mono">{data.name}</span>
          </PageTitle>
          {data.description !== '' && <p className="break-words text-text-2">{data.description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-md">
          {may.proposeTreatment && (
            <ProposeChange
              companyId={companyId}
              modelId={modelId}
              sql={active?.sql ?? ''}
              description={data.description}
            />
          )}
          {proposal !== null && (
            <Approve companyId={companyId} modelId={modelId} name={data.name} proposal={proposal} />
          )}
        </div>
      </div>
      <Tabbed
        names={['overview', 'sql', 'from', 'readBy', 'versions']}
        panels={{
          overview: (
            <div className="flex flex-col gap-lg">
              <dl className="flex flex-col">
                <Fact label={ACTIVE}>{active === null ? NO_ACTIVE : activeLine(active)}</Fact>
                <Fact label={LAST_RUN}>
                  <span className="tabular-nums">{runText(entry?.lastRun ?? null)}</span>
                </Fact>
              </dl>
              {proposal !== null && (
                <div className="flex flex-col gap-sm">
                  <Badge tone="warning" className="w-fit">
                    {PROPOSAL}
                  </Badge>
                  <Reads companyId={companyId} inputs={proposal.inputs} />
                </div>
              )}
            </div>
          ),
          sql: shown === null ? null : <Sql sql={shown.sql} />,
          from: <Refs companyId={companyId} refs={shown?.inputs ?? []} none={NOTHING_READ} />,
          readBy: <Refs companyId={companyId} refs={entry?.readBy ?? []} none={NO_READER} />,
          versions: (
            <List>
              {data.versions.map((version) => (
                <Row key={version.number}>
                  <div className="flex flex-wrap items-center gap-x-md gap-y-xs px-sm py-md">
                    <span className="font-medium">v{version.number}</span>
                    {version.number === active?.number && <Badge tone="success">{ACTIVE}</Badge>}
                    <span className="text-text-2">{versionLine(version)}</span>
                  </div>
                </Row>
              ))}
            </List>
          ),
        }}
      />
    </>
  )
}

/** One treatment of the company: its bound version, the proposal that waits, the SQL, what it reads, who reads it and the Versões tab. */
export function BusinessModelPage() {
  const { companyId, modelId } = businessRoute.useParams()
  const model = useQuery(treatmentModelQuery(companyId, modelId))
  const treated = useTreatedTables(companyId)
  const may = useMay()
  if (may.proposeTreatment && model.error instanceof HubFailure && model.error.code === 'NOT_FOUND')
    return <NotFound />
  const entry = treated.data?.tables.find(
    (one): one is Model => one.layer === 'negocio' && one.id === modelId,
  )
  return (
    <Gate>
      <Back companyId={companyId} layer="business" />
      {model.isPending && <TabsSkeleton />}
      {model.isError && <ReadFailure text={READ_FAILED} onRetry={() => void model.refetch()} />}
      {model.isSuccess && (
        <ModelBody companyId={companyId} modelId={modelId} data={model.data} entry={entry} />
      )}
    </Gate>
  )
}
