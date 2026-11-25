import type { CompanyId, LakeTableSummary } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { PageTitle } from '../../ui/list.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs.tsx'
import { connectionsQuery, connectorName } from '../connectors/public.ts'
import { lakeTablesListQuery } from './lake-queries.ts'
import { Runs } from './lake-runs.tsx'
import { RunBadge } from './lake-state.tsx'
import { Columns, Details, Overview } from './lake-tabs.tsx'
import { BACK_TO_DATA, CATALOG_FAILED, lakeOfText, NOT_COPIED_ANYMORE, TABLE_TABS } from './text.ts'

const route = getRouteApi('/_app/companies/$companyId/data/lake/$tableId')

function Back({ companyId }: { companyId: CompanyId }) {
  return (
    <Link
      to="/companies/$companyId/data"
      params={{ companyId }}
      className="inline-flex w-fit items-center gap-xs text-text-2 underline underline-offset-2"
    >
      <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
      {BACK_TO_DATA}
    </Link>
  )
}

/** The table's label first, then its name in the lake and where it came from, then how its last round ended. */
function Head(props: { table: LakeTableSummary; system: string }) {
  const { table, system } = props
  return (
    <div className="flex flex-col gap-xs">
      <span className="text-text-2">{lakeOfText(table.connection.name)}</span>
      <PageTitle className="break-words">{table.label}</PageTitle>
      <p className="flex flex-wrap items-center gap-x-md gap-y-xs">
        <span className="wrap-anywhere font-mono text-fact">{table.name}</span>
        <span className="font-mono text-fact text-text-2">
          {system} · {table.source}
        </span>
        <RunBadge run={table.lastRun} />
      </p>
    </div>
  )
}

function Page(props: {
  companyId: CompanyId
  table: LakeTableSummary
  system: string
  tables: number
}) {
  const { companyId, table, system } = props
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-xl">
      <Back companyId={companyId} />
      <Head table={table} system={system} />
      <Tabs defaultValue="overview" className="gap-lg">
        <TabsList className="w-full overflow-x-auto border-b border-line">
          <TabsTrigger value="overview">{TABLE_TABS.overview}</TabsTrigger>
          <TabsTrigger value="columns">{TABLE_TABS.columns}</TabsTrigger>
          <TabsTrigger value="runs">{TABLE_TABS.runs}</TabsTrigger>
          <TabsTrigger value="details">{TABLE_TABS.details}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Overview table={table} system={system} />
        </TabsContent>
        <TabsContent value="columns">
          <Columns table={table} />
        </TabsContent>
        <TabsContent value="runs">
          <Runs companyId={companyId} tableId={table.id} system={system} tables={props.tables} />
        </TabsContent>
        <TabsContent value="details">
          <Details table={table} system={system} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/** One table of the lake, with the four tabs the Airbyte and Nekt source pages have; a table no longer copied says so. */
export function LakeDetail() {
  const { companyId, tableId } = route.useParams()
  const lake = useQuery(lakeTablesListQuery(companyId))
  const connections = useQuery(connectionsQuery(companyId))
  if (lake.isPending || connections.isPending) return <Skeleton className="h-24 w-full" />
  if (lake.isError || connections.isError) {
    const retry = lake.isError ? lake : connections
    return <ReadFailure text={CATALOG_FAILED} onRetry={() => void retry.refetch()} />
  }
  const table = lake.data.find((one) => one.id === tableId)
  if (table === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-page flex-col gap-lg">
        <Back companyId={companyId} />
        <Empty>{NOT_COPIED_ANYMORE}</Empty>
      </div>
    )
  }
  const system = connectorName(connections.data.connectors, table.connection.connector)
  const tables = lake.data.filter((one) => one.connection.id === table.connection.id).length
  return <Page companyId={companyId} table={table} system={system} tables={tables} />
}
