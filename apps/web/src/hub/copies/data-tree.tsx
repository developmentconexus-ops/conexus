import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { SearchField } from '../../ui/search-field.tsx'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '../../ui/sidebar.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { connectionsQuery } from '../connectors/public.ts'
import { systemsOf } from './data-systems.ts'
import { useMay } from './member.ts'
import type { DataLayer } from './search.ts'
import {
  CATALOG_FAILED,
  DATA_LAYERS,
  LOADING_LABEL,
  NO_SYSTEM,
  NO_TABLE_COPIED,
  NO_TABLE_OF_ROLE_SHORT,
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

function RawGroup(props: { companyId: CompanyId; q: string | undefined }) {
  const { companyId, q } = props
  return (
    <>
      <LayerGroup companyId={companyId} layer="raw" q={q} count={0} />
      <SidebarGroup className="pt-0">
        <RawNote companyId={companyId} />
      </SidebarGroup>
    </>
  )
}

function RawNote({ companyId }: { companyId: CompanyId }) {
  const manage = useMay().manageCopies
  const connections = useQuery({ ...connectionsQuery(companyId), enabled: manage })
  if (!manage) return <p className={NOTE}>{NO_TABLE_OF_ROLE_SHORT}</p>
  if (connections.isPending) {
    return (
      <div role="status">
        <span className="sr-only">{LOADING_LABEL}</span>
        <SidebarMenuSkeleton />
        <SidebarMenuSkeleton />
        <SidebarMenuSkeleton />
      </div>
    )
  }
  if (connections.isError) {
    return (
      <div className="px-[0.6rem]">
        <ReadFailure text={CATALOG_FAILED} onRetry={() => void connections.refetch()} />
      </div>
    )
  }
  const linked = systemsOf(connections.data.connections).length > 0
  return <p className={NOTE}>{linked ? NO_TABLE_COPIED : NO_SYSTEM}</p>
}

/** The tree of Dados in the frame's `nav`, in place of the conversations: Negócio, Bruto, Apps. */
export function DataTree({ companyId, q }: { companyId: CompanyId; q: string | undefined }) {
  const may = useMay()
  return (
    <nav aria-label={TREE_LABEL} className="flex min-w-0 flex-col">
      <SidebarGroup>
        <TreeSearch q={q} />
      </SidebarGroup>
      <LayerGroup companyId={companyId} layer="business" q={q} count={0} />
      <RawGroup companyId={companyId} q={q} />
      {may.viewAppData && <LayerGroup companyId={companyId} layer="apps" q={q} />}
    </nav>
  )
}
