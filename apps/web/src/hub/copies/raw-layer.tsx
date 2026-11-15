import type { CompanyId, ConnectorEntry, CopyProposalSummary, CopySummary } from '@conexus/hub-api'
import type { UseQueryResult } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../ui/input-group.tsx'
import { List } from '../../ui/list.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { Table, TableBody, TableCell, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { ConnectorLogo, connectionsQuery, connectorName } from '../connectors/public.ts'
import type { Props } from './copy-list.tsx'
import { CELL, CopyPhoneRow, CopyTableRow, HeadRow, Proposals } from './copy-list.tsx'
import type { System } from './data-systems.ts'
import { answers, systemsOf } from './data-systems.ts'
import {
  CATALOG_FAILED,
  DATA_COLUMNS,
  LINK_SYSTEM,
  NO_MATCH,
  NO_SYSTEM,
  NO_SYSTEM_HINT,
  NO_TABLE_COPIED,
  RAW_INTRO,
  SEARCH_TABLES,
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

function SystemTable(props: {
  companyId: CompanyId
  systems: System[]
  connectors: readonly ConnectorEntry[]
  onNote: Props['onNote']
}) {
  const { companyId, systems, connectors, onNote } = props
  return (
    <Table>
      <HeadRow heads={DATA_COLUMNS} right="Linhas" />
      {systems.map((system) => (
        <TableBody key={system.connector}>
          <TableRow className="bg-surface-2">
            <TableCell colSpan={DATA_COLUMNS.length + 1} className={CELL}>
              <SystemTitle system={system} connectors={connectors} />
            </TableCell>
          </TableRow>
          {system.copies.length === 0 && (
            <TableRow>
              <TableCell colSpan={DATA_COLUMNS.length + 1} className={`${CELL} text-text-2`}>
                {NO_TABLE_COPIED}
              </TableCell>
            </TableRow>
          )}
          {system.copies.map((copy) => (
            <CopyTableRow key={copy.id} companyId={companyId} copy={copy} onNote={onNote} />
          ))}
        </TableBody>
      ))}
    </Table>
  )
}

function SystemPhoneList(props: {
  companyId: CompanyId
  systems: System[]
  connectors: readonly ConnectorEntry[]
  onNote: Props['onNote']
}) {
  const { companyId, systems, connectors, onNote } = props
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
                <CopyPhoneRow key={copy.id} companyId={companyId} copy={copy} onNote={onNote} />
              ))}
            </List>
          )}
        </section>
      ))}
    </div>
  )
}

/** The search of the layer: the text is kept in the address, `q` (web W18), and the list answers at once. */
function TableSearch({ initial }: { initial: string | undefined }) {
  const [text, setText] = useState(initial ?? '')
  const navigate = useNavigate()
  return (
    <InputGroup className="h-control max-w-column">
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={SEARCH_TABLES}
        placeholder={SEARCH_TABLES}
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          void navigate({
            to: '.',
            search: (previous) => ({ ...previous, q: event.target.value || undefined }),
            replace: true,
          })
        }}
      />
    </InputGroup>
  )
}

type Read = UseQueryResult<{ copies: CopySummary[]; proposals: CopyProposalSummary[] }>

/** What the layer says when the company has no system linked and no proposal. */
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

/**
 * The **Bruto** layer of Dados: the Builder's open proposals on top, then every system with its
 * copies as tables: the name in mono, what it holds, its state, its last run, its rows, interval and
 * Projetos. A system linked and not yet copied says so. The search keeps the tables that answer.
 */
export function RawLayer(props: {
  companyId: CompanyId
  read: Read
  q: string | undefined
  onNote: Props['onNote']
}) {
  const { companyId, read, q, onNote } = props
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
  const { copies, proposals } = read.data
  const { connectors } = connections.data
  const all = systemsOf(copies, connections.data.connections)
  const query = q?.trim() ?? ''
  const systems = all
    .map((system) => ({
      ...system,
      copies: system.copies.filter((copy) => query === '' || answers(copy, query)),
    }))
    .filter((system) => query === '' || system.copies.length > 0)
  if (all.length === 0 && proposals.length === 0) return <NoSystem companyId={companyId} />
  return (
    <div className="flex flex-col gap-lg">
      <Proposals companyId={companyId} proposals={proposals} onNote={onNote} />
      <div className="flex flex-wrap items-center justify-between gap-md">
        <TableSearch initial={q} />
        <p className="text-text-2">{RAW_INTRO}</p>
      </div>
      {systems.length === 0 && <Empty>{NO_MATCH}</Empty>}
      {systems.length > 0 &&
        (phone ? (
          <SystemPhoneList
            companyId={companyId}
            systems={systems}
            connectors={connectors}
            onNote={onNote}
          />
        ) : (
          <SystemTable
            companyId={companyId}
            systems={systems}
            connectors={connectors}
            onNote={onNote}
          />
        ))}
    </div>
  )
}
