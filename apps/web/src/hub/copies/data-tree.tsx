import type { CompanyId, ConnectorEntry, CopyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ChevronDownIcon, CirclePauseIcon, SearchIcon, Table2Icon } from 'lucide-react'
import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible.tsx'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../ui/input-group.tsx'
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
import { answers, systemsOf } from './data-systems.ts'
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
            className={`${ICON} font-medium text-text`}
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
  const navigate = useNavigate()
  return (
    <InputGroup>
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={SEARCH_TABLES}
        placeholder={SEARCH_TABLES}
        className="[&::-webkit-search-cancel-button]:appearance-none"
        value={typed}
        onChange={(event) => {
          setTyped(event.target.value)
          void navigate({
            to: '.',
            search: (old) => ({ ...old, q: event.target.value || undefined }),
            replace: true,
            state: { keepDrawer: true },
          })
        }}
      />
    </InputGroup>
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
          <span className="min-w-0 truncate">{connectorName(connectors, system.connector)}</span>{' '}
          <span className={TAIL}>{system.copies.length}</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenu className="ps-lg">
            {system.copies.map((copy) => {
              const paused = copy.schedule.kind === 'PAUSED'
              return (
                <SidebarMenuItem key={copy.id}>
                  <SidebarMenuButton
                    className={ICON}
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

function RawGroup(props: {
  companyId: CompanyId
  copies: ReturnType<typeof useCopies>
  connections: ReturnType<typeof useConnections>
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
  copies: ReturnType<typeof useCopies>
  connections: ReturnType<typeof useConnections>
  current: CopyId | undefined
  q: string | undefined
}) {
  const { companyId, copies, connections, current, q } = props
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
    return (
      <div className="px-[0.6rem]">
        <ReadFailure
          text={CATALOG_FAILED}
          onRetry={() => void (copies.isError ? copies.refetch() : connections.refetch())}
        />
      </div>
    )
  }
  const all = systemsOf(copies.data.copies, connections.data.connections)
  if (all.length === 0) return <p className={NOTE}>{NO_SYSTEM}</p>
  const withCopies = all.filter((system) => system.copies.length > 0)
  if (withCopies.length === 0) return <p className={NOTE}>{NO_TABLE_COPIED}</p>
  const query = q?.trim() ?? ''
  const shown = withCopies
    .map((system) => ({
      ...system,
      copies: system.copies.filter((copy) => query === '' || answers(copy, query)),
    }))
    .filter((system) => system.copies.length > 0)
  if (shown.length === 0) return <p className={NOTE}>{NO_MATCH}</p>
  return (
    <SidebarMenu>
      {shown.map((system, at) => (
        <SystemBranch
          key={system.connector}
          companyId={companyId}
          system={system}
          connectors={connections.data.connectors}
          q={q}
          defaultOpen={
            query !== '' ||
            system.copies.some((copy) => copy.id === current) ||
            (current === undefined && at === 0)
          }
        />
      ))}
    </SidebarMenu>
  )
}

function useCopies(companyId: CompanyId) {
  return useQuery(copiesQuery(companyId))
}

function useConnections(companyId: CompanyId) {
  return useQuery(connectionsQuery(companyId))
}

/** The tree of Dados in the frame's `nav`, in place of the conversations: Negócio, Bruto by system with its tables, Apps. */
export function DataTree({ companyId, q }: { companyId: CompanyId; q: string | undefined }) {
  const copies = useCopies(companyId)
  const connections = useConnections(companyId)
  const current = useParams({ strict: false, select: (params) => params.copyId })
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
      <LayerGroup companyId={companyId} layer="apps" q={q} />
    </nav>
  )
}
