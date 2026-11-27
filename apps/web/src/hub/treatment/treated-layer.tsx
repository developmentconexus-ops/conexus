import type {
  CompanyId,
  Connection,
  ConnectorEntry,
  TreatedTable,
  TreatedTables,
} from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button } from '../../ui/button.tsx'
import { List, Row } from '../../ui/list.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { connectionsQuery, connectorName } from '../connectors/public.ts'
import { useMay } from './may.ts'
import { isOpen, sendTreatmentRun, useTreatedTables } from './queries.ts'
import { NO_TREATED, OUTDATED_LAKE, READ_FAILED, RUN_NOW, runText, runTopText } from './text.ts'
import { StopRun } from './treatment-stop.tsx'

type Treated = Extract<TreatedTable, { layer: 'tratado' }>

function Line({ companyId, table }: { companyId: CompanyId; table: Treated }) {
  const failed = table.lastRun?.status === 'FAILED'
  return (
    <Row>
      <div className="flex flex-col gap-xs px-sm py-md">
        <Link
          to="/companies/$companyId/data/treated/$name"
          params={{ companyId, name: table.name }}
          className="w-fit font-medium underline-offset-2 hover:underline"
        >
          {table.label}
        </Link>
        <span className="wrap-anywhere font-mono text-fact text-text-2">{table.name}</span>
        {table.description !== '' && (
          <span className="break-words text-text-2">{table.description}</span>
        )}
        <span className={failed ? 'text-danger-text' : 'text-text-2 tabular-nums'}>
          {runText(table.lastRun)}
        </span>
      </div>
    </Row>
  )
}

/** The system and the connection a group of tables came from: "Sankhya · Matriz". */
function groupName(
  data: Readonly<{ connections: readonly Connection[]; connectors: readonly ConnectorEntry[] }>,
  id: Treated['connectionId'],
): string {
  const connection = data.connections.find((one) => one.id === id)
  if (connection === undefined) return ''
  return `${connectorName(data.connectors, connection.connector)} · ${connection.name}`
}

/** Tratar agora, and Parar beside it while a run is open; a request the Hub refuses says its sentence. */
function RunBar(props: { companyId: CompanyId; run: TreatedTables['lastRun'] }) {
  const { companyId, run } = props
  const send = useMutation(sendTreatmentRun)
  const open = isOpen(run)
  return (
    <div className="flex flex-wrap items-center gap-md">
      <Button
        variant="primary"
        disabled={open || send.isPending}
        onClick={() => send.mutate({ params: { companyId } })}
      >
        {RUN_NOW}
      </Button>
      {open && <StopRun companyId={companyId} run={run} />}
      {send.isError && (
        <Alert tone="danger" className="basis-full">
          {sentenceOf(send.error)}
        </Alert>
      )}
    </div>
  )
}

/** The **Tratado** layer: the tables the Hub writes after each copy, by system, with the last run on top. */
export function TreatedLayer({ companyId }: { companyId: CompanyId }) {
  const may = useMay()
  const treated = useTreatedTables(companyId)
  const connections = useQuery(connectionsQuery(companyId))
  if (treated.isPending || connections.isPending) return <Skeleton className="h-24 w-full" />
  if (treated.isError || connections.isError) {
    const failed = treated.isError ? treated : connections
    return <ReadFailure text={READ_FAILED} onRetry={() => void failed.refetch()} />
  }
  const { lake, lastRun, tables } = treated.data
  if (lake === 'OUTDATED') return <p className="font-medium">{OUTDATED_LAKE}</p>
  const rows = tables.filter((table): table is Treated => table.layer === 'tratado')
  const top = runTopText(lastRun)
  return (
    <div className="flex flex-col gap-lg">
      {may.approveTreatment && <RunBar companyId={companyId} run={lastRun} />}
      {top !== null &&
        (lastRun?.state === 'FAILED' ? (
          <Alert tone="danger">{top}</Alert>
        ) : (
          <p className="text-text-2">{top}</p>
        ))}
      {rows.length === 0 && <Empty>{NO_TREATED}</Empty>}
      {[...new Set(rows.map((table) => table.connectionId))].map((id) => (
        <section key={id} className="flex flex-col gap-sm">
          <h2 className="font-medium">{groupName(connections.data, id)}</h2>
          <List>
            {rows
              .filter((table) => table.connectionId === id)
              .map((table) => (
                <Line key={table.name} companyId={companyId} table={table} />
              ))}
          </List>
        </section>
      ))}
    </div>
  )
}
