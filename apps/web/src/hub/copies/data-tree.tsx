import type { CompanyId, Connection, ConnectorEntry, CopyId, CopySummary } from '@conexus/hub-api'
import type { UseQueryResult } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ChevronDownIcon, CirclePauseIcon, Table2Icon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible.tsx'
import { SearchField } from '../../ui/search-field.tsx'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '../../ui/sidebar.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { ConnectorLogo, connectionsQuery, connectorName } from '../connectors/public.ts'
import type { System } from './data-systems.ts'
import { narrowed, systemsOf } from './data-systems.ts'
import { useMay } from './member.ts'
import { copiesQuery } from './queries.ts'
import type { DataLayer } from './search.ts'
import {
  CATALOG_FAILED,
  countText,
  DATA_LAYERS,
  LOADING_LABEL,
  NO_MATCH,
  NO_SYSTEM,
  NO_TABLE_COPIED,
  NO_TABLE_OF_ROLE_SHORT,
  PAUSED_LABEL,
  SEARCH_TABLES,
  TREE_LABEL,
} from './text.ts'

const ICON = '[&_svg]:size-4'
const TAIL = 'ms-auto shrink-0 text-eyebrow tabular-nums text-text-2'
const NOTE = 'px-[0.6rem] text-text-2'

/** A layer of Dados as a line of the tree. Bruto is the page without `layer`, the layer the address means when it says none. */
function LayerGroup(props: {
  companyId: CompanyId
  layer: DataLayer
  q: string | undefined
  count?: number
}) {
  const { companyId, layer, q, count } = props
  const raw = layer === 'raw'
  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            className={`${ICON} font-semibold text-text`}
            render={
              <Link
                to="/companies/$companyId/data"
                params={{ companyId }}
                search={raw ? { q } : { layer, q }}
                activeOptions={raw ? { exact: true } : undefined}
              />
            }
          >
            <span className="min-w-0 truncate">{DATA_LAYERS[layer]}</span>{' '}
            {count !== undefined && <span className={TAIL}>{count}</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

/** The search of the tree: the text is kept in the address, `q` (web W18), replaced as the person types; the phone's drawer stays open. */
function TreeSearch({ q }: { q: string | undefined }) {
  const [typed, setTyped] = useState(q ?? '')
  const sent = useRef(new Set<string>())
  const navigate = useNavigate()
  useEffect(() => {
    if (sent.current.delete(q ?? '')) return
    setTyped(q ?? '')
  }, [q])
  return (
    <SearchField
      label={SEARCH_TABLES}
      value={typed}
      onChange={(query) => {
        setTyped(query)
        sent.current.add(query)
        void navigate({
          to: '.',
          search: (old) => ({ ...old, q: query || undefined }),
          replace: true,
          state: { keepDrawer: true },
        })
      }}
    />
  )
}

function SystemBranch(props: {
  companyId: CompanyId
  system: System
  connectors: readonly ConnectorEntry[]
  q: string | undefined
  defaultOpen: boolean
}) {
  const { companyId, system, connectors, q, defaultOpen } = props
  const entry = connectors.find((one) => one.id === system.connector)
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger render={<SidebarMenuButton className={ICON} />}>
          <ChevronDownIcon
            aria-hidden="true"
            className="-rotate-90 motion-safe:transition-transform [[data-panel-open]>&]:rotate-0"
          />
          {entry !== undefined && <ConnectorLogo entry={entry} small />}
          <span className="min-w-0 truncate font-medium text-text">
            {connectorName(connectors, system.connector)}
          </span>{' '}
          <span className={TAIL}>{system.copies.length}</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenu>
            {system.copies.map((copy) => {
              const paused = copy.schedule.kind === 'PAUSED'
              return (
                <SidebarMenuItem key={copy.id}>
                  <SidebarMenuButton
                    className={`${ICON} ps-[2.2rem]`}
                    render={
                      <Link
                        to="/companies/$companyId/data/$copyId"
                        params={{ companyId, copyId: copy.id }}
                        search={{ q }}
                      />
                    }
                  >
                    {paused ? (
                      <CirclePauseIcon aria-hidden="true" />
                    ) : (
                      <Table2Icon aria-hidden="true" />
                    )}
                    <span className="min-w-0 truncate font-mono text-fact">{copy.name}</span>{' '}
                    <span className={TAIL}>
                      {paused ? PAUSED_LABEL : copy.rows === null ? '—' : countText(copy.rows)}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

type CopiesRead = UseQueryResult<{ copies: CopySummary[] }>
type ConnectionsRead = UseQueryResult<{ connections: Connection[]; connectors: ConnectorEntry[] }>

function RawGroup(props: {
  companyId: CompanyId
  copies: CopiesRead
  connections: ConnectionsRead
  current: CopyId | undefined
  q: string | undefined
}) {
  const { companyId, copies, connections, current, q } = props
  return (
    <>
      <LayerGroup companyId={companyId} layer="raw" q={q} count={copies.data?.copies.length} />
      <SidebarGroup className="pt-0">
        <RawBody
          companyId={companyId}
          copies={copies}
          connections={connections}
          current={current}
          q={q}
        />
      </SidebarGroup>
    </>
  )
}

function RawBody(props: {
  companyId: CompanyId
  copies: CopiesRead
  connections: ConnectionsRead
  current: CopyId | undefined
  q: string | undefined
}) {
  const { companyId, copies, connections, current, q } = props
  const manage = useMay().manageCopies
  if (copies.isPending || connections.isPending) {
    return (
      <div role="status">
        <span className="sr-only">{LOADING_LABEL}</span>
        <SidebarMenuSkeleton />
        <SidebarMenuSkeleton />
        <SidebarMenuSkeleton />
      </div>
    )
  }
  if (copies.isError || connections.isError) {
    const failed = [copies, connections].filter((read) => read.isError)
    return (
      <div className="px-[0.6rem]">
        <ReadFailure
          text={CATALOG_FAILED}
          onRetry={() => {
            for (const read of failed) void read.refetch()
          }}
        />
      </div>
    )
  }
  const all = systemsOf(copies.data.copies, manage ? connections.data.connections : [])
  if (all.length === 0) return <p className={NOTE}>{manage ? NO_SYSTEM : NO_TABLE_OF_ROLE_SHORT}</p>
  const withCopies = all.filter((system) => system.copies.length > 0)
  if (withCopies.length === 0) return <p className={NOTE}>{NO_TABLE_COPIED}</p>
  const searching = (q?.trim() ?? '') !== ''
  const shown = narrowed(withCopies, q)
  if (shown.length === 0) return <p className={NOTE}>{NO_MATCH}</p>
  return (
    <SidebarMenu>
      {shown.map((system, at) => {
        const forced = searching || system.copies.some((copy) => copy.id === current)
        return (
          <SystemBranch
            key={`${system.connector}:${forced ? 'open' : 'free'}`}
            companyId={companyId}
            system={system}
            connectors={connections.data.connectors}
            q={q}
            defaultOpen={forced || (current === undefined && at === 0)}
          />
        )
      })}
    </SidebarMenu>
  )
}

/** The tree of Dados in the frame's `nav`, in place of the conversations: Negócio, Bruto by system with its tables, Apps. */
export function DataTree({ companyId, q }: { companyId: CompanyId; q: string | undefined }) {
  const copies = useQuery(copiesQuery(companyId))
  const connections = useQuery(connectionsQuery(companyId))
  const current = useParams({ strict: false, select: (params) => params.copyId })
  const may = useMay()
  return (
    <nav aria-label={TREE_LABEL} className="flex min-w-0 flex-col">
      <SidebarGroup>
        <TreeSearch q={q} />
      </SidebarGroup>
      <LayerGroup companyId={companyId} layer="business" q={q} count={0} />
      <RawGroup
        companyId={companyId}
        copies={copies}
        connections={connections}
        current={current}
        q={q}
      />
      {may.viewAppData && <LayerGroup companyId={companyId} layer="apps" q={q} />}
    </nav>
  )
}
