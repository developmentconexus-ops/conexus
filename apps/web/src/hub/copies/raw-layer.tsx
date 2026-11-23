import type { CompanyId, ConnectorEntry, CopySummary } from '@conexus/hub-api'
import type { UseQueryResult } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { List } from '../../ui/list.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { Table, TableBody, TableCell, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { ConnectorLogo, connectionsQuery, connectorName } from '../connectors/public.ts'
import { CELL, CopyPhoneRow, CopyTableRow, HeadRow } from './copy-list.tsx'
import type { System } from './data-systems.ts'
import { narrowed, systemsOf } from './data-systems.ts'
import {
  CATALOG_FAILED,
  DATA_COLUMNS,
  LINK_SYSTEM,
  NO_MATCH,
  NO_SYSTEM,
  NO_SYSTEM_HINT,
  NO_TABLE_COPIED,
  NO_TABLE_OF_ROLE,
  RAW_INTRO,
  systemText,
} from './text.ts'

function SystemTitle(props: { system: System; connectors: readonly ConnectorEntry[] }) {
  const { system, connectors } = props
  const entry = connectors.find((one) => one.id === system.connector)
  return (
    <span className="flex items-center gap-sm font-medium">
      {entry !== undefined && <ConnectorLogo entry={entry} small />}
      {systemText(
        connectorName(connectors, system.connector),
        [...system.accounts],
        system.copies.length,
      )}
    </span>
  )
}

type Listing = {
  companyId: CompanyId
  systems: System[]
  connectors: readonly ConnectorEntry[]
}

function SystemTable(props: Listing) {
  const { companyId, systems, connectors } = props
  return (
    <Table>
      <HeadRow heads={DATA_COLUMNS} right="Linhas" />
      {systems.map((system) => (
        <TableBody key={system.connector}>
          <TableRow>
            <TableCell colSpan={DATA_COLUMNS.length} className={CELL}>
              <SystemTitle system={system} connectors={connectors} />
            </TableCell>
          </TableRow>
          {system.copies.length === 0 && (
            <TableRow>
              <TableCell colSpan={DATA_COLUMNS.length} className={`${CELL} text-text-2`}>
                {NO_TABLE_COPIED}
              </TableCell>
            </TableRow>
          )}
          {system.copies.map((copy) => (
            <CopyTableRow key={copy.id} companyId={companyId} copy={copy} />
          ))}
        </TableBody>
      ))}
    </Table>
  )
}

function SystemPhoneList(props: Listing) {
  const { companyId, systems, connectors } = props
  return (
    <div className="flex flex-col gap-lg">
      {systems.map((system) => (
        <section key={system.connector} className="flex flex-col gap-sm">
          <SystemTitle system={system} connectors={connectors} />
          {system.copies.length === 0 ? (
            <Empty>{NO_TABLE_COPIED}</Empty>
          ) : (
            <List>
              {system.copies.map((copy) => (
                <CopyPhoneRow key={copy.id} companyId={companyId} copy={copy} />
              ))}
            </List>
          )}
        </section>
      ))}
    </div>
  )
}

type Read = UseQueryResult<{ copies: CopySummary[] }>

function NoSystem({ companyId }: { companyId: CompanyId }) {
  return (
    <div className="flex flex-col items-start gap-sm">
      <p className="font-medium">{NO_SYSTEM}</p>
      <Empty>{NO_SYSTEM_HINT}</Empty>
      <Link
        to="/companies/$companyId/integrations"
        params={{ companyId }}
        className="text-text-2 underline underline-offset-2"
      >
        {LINK_SYSTEM}
      </Link>
    </div>
  )
}

export function RawLayer(props: {
  companyId: CompanyId
  read: Read
  q: string | undefined
  manage: boolean
}) {
  const { companyId, read, q, manage } = props
  const connections = useQuery(connectionsQuery(companyId))
  const phone = useIsMobile()
  if (read.isPending) return <Skeleton className="h-24 w-full" />
  if (read.isError) {
    return <ReadFailure text={CATALOG_FAILED} onRetry={() => void read.refetch()} />
  }
  if (connections.isError) {
    return <ReadFailure text={CATALOG_FAILED} onRetry={() => void connections.refetch()} />
  }
  if (connections.isPending) return <Skeleton className="h-24 w-full" />
  const { copies } = read.data
  const { connectors } = connections.data
  const all = systemsOf(copies, manage ? connections.data.connections : [])
  const systems = narrowed(all, q)
  if (!manage && all.length === 0) return <p className="font-medium">{NO_TABLE_OF_ROLE}</p>
  if (all.length === 0) return <NoSystem companyId={companyId} />
  const listing = { companyId, systems, connectors }
  return (
    <div className="flex flex-col gap-lg">
      <p className="text-text-2">{RAW_INTRO}</p>
      {systems.length === 0 && <Empty>{NO_MATCH}</Empty>}
      {systems.length > 0 &&
        (phone ? <SystemPhoneList {...listing} /> : <SystemTable {...listing} />)}
    </div>
  )
}
