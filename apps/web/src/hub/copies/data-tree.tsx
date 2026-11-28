import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '../../ui/sidebar.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { connectionsQuery } from '../connectors/public.ts'
import { connectionsOfData } from './data-systems.ts'
import { lakeTablesListQuery } from './lake-queries.ts'
import { useMay } from './member.ts'
import type { DataLayer } from './search.ts'
import {
  CATALOG_FAILED,
  DATA_LAYERS,
  LOADING_LABEL,
  lakeTablesNoteText,
  NO_SYSTEM,
  NO_TABLE_COPIED,
  NO_TABLE_OF_ROLE_SHORT,
  TREE_LABEL,
} from './text.ts'

const ICON = '[&_svg]:size-4'
const TAIL = 'ms-auto shrink-0 text-eyebrow tabular-nums text-text-2'
const NOTE = 'px-[0.6rem] text-text-2'

/** A layer of Dados as a line of the tree. Copiado is the page without `layer`, the layer the address means when it says none. */
function LayerGroup(props: { companyId: CompanyId; layer: DataLayer; count?: number }) {
  const { companyId, layer, count } = props
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
                search={raw ? {} : { layer }}
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

function RawGroup({ companyId }: { companyId: CompanyId }) {
  const manage = useMay().manageCopies
  const lake = useQuery({ ...lakeTablesListQuery(companyId), enabled: manage })
  return (
    <>
      <LayerGroup companyId={companyId} layer="raw" count={lake.data?.length ?? 0} />
      <SidebarGroup className="pt-0">
        <RawNote companyId={companyId} />
      </SidebarGroup>
    </>
  )
}

function RawNote({ companyId }: { companyId: CompanyId }) {
  const manage = useMay().manageCopies
  const connections = useQuery({ ...connectionsQuery(companyId), enabled: manage })
  const lake = useQuery({ ...lakeTablesListQuery(companyId), enabled: manage })
  if (!manage) return <p className={NOTE}>{NO_TABLE_OF_ROLE_SHORT}</p>
  if (connections.isPending || lake.isPending) {
    return (
      <div role="status">
        <span className="sr-only">{LOADING_LABEL}</span>
        <SidebarMenuSkeleton />
        <SidebarMenuSkeleton />
        <SidebarMenuSkeleton />
      </div>
    )
  }
  if (connections.isError || lake.isError) {
    const failed = connections.isError ? connections : lake
    return (
      <div className="px-[0.6rem]">
        <ReadFailure text={CATALOG_FAILED} onRetry={() => void failed.refetch()} />
      </div>
    )
  }
  const linked =
    connectionsOfData(connections.data.connections, connections.data.connectors, lake.data).length >
    0
  if (lake.data.length > 0) return <p className={NOTE}>{lakeTablesNoteText(lake.data.length)}</p>
  return <p className={NOTE}>{linked ? NO_TABLE_COPIED : NO_SYSTEM}</p>
}

/** The tree of Dados in the frame's `nav`: Copiado, Tratado, Negócio, Apps. */
export function DataTree({ companyId }: { companyId: CompanyId }) {
  const may = useMay()
  return (
    <nav aria-label={TREE_LABEL} className="flex min-w-0 flex-col">
      <RawGroup companyId={companyId} />
      <LayerGroup companyId={companyId} layer="treated" />
      <LayerGroup companyId={companyId} layer="business" />
      {may.viewAppData && <LayerGroup companyId={companyId} layer="apps" />}
    </nav>
  )
}
