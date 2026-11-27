import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { PageTitle } from '../../ui/list.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { ConnectorLogo, connectionsQuery, connectorName, stateBadge } from '../connectors/public.ts'
import { BusinessLayer, TreatedLayer } from '../treatment/public.ts'
import { AppsLayer } from './apps-layer.tsx'
import { connectionsOfData } from './data-systems.ts'
import { LakeList } from './lake-list.tsx'
import { lakeTablesListQuery } from './lake-queries.ts'
import { useMay } from './member.ts'
import { DataLayer } from './search.ts'
import {
  CATALOG_FAILED,
  DATA_INTRO,
  DATA_TITLE,
  LINK_SYSTEM,
  lakeGroupText,
  NO_SYSTEM,
  NO_SYSTEM_HINT,
  NO_TABLE_COPIED,
  NO_TABLE_OF_ROLE,
} from './text.ts'

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

/** The **Copiado** layer: each active connection of the company, with the lake tables it copies. */
function SystemsLayer({ companyId }: { companyId: CompanyId }) {
  const connections = useQuery(connectionsQuery(companyId))
  const lake = useQuery(lakeTablesListQuery(companyId))
  if (connections.isPending || lake.isPending) return <Skeleton className="h-24 w-full" />
  if (connections.isError || lake.isError) {
    const failed = connections.isError ? connections : lake
    return <ReadFailure text={CATALOG_FAILED} onRetry={() => void failed.refetch()} />
  }
  const { connectors } = connections.data
  const active = connectionsOfData(connections.data.connections, connectors, lake.data)
  if (active.length === 0) return <NoSystem companyId={companyId} />
  return (
    <div className="flex flex-col gap-lg">
      {active.map((connection) => {
        const entry = connectors.find((one) => one.id === connection.connector)
        const system = connectorName(connectors, connection.connector)
        const tables = lake.data.filter((table) => table.connection.id === connection.id)
        const badge =
          connection.state === 'ACTIVE'
            ? null
            : stateBadge(connection, entry?.auth ?? 'client_credentials')
        const state = badge?.text ?? null
        const title = lakeGroupText(connection.name, tables.length, state)
        return (
          <section key={connection.id} className="flex flex-col gap-sm">
            <span className="flex items-center gap-sm font-medium">
              {entry !== undefined && <ConnectorLogo entry={entry} small />}
              {title}
            </span>
            {tables.length === 0 ? (
              <Empty>{NO_TABLE_COPIED}</Empty>
            ) : (
              <LakeList
                companyId={companyId}
                tables={tables}
                system={system}
                name={connection.name}
              />
            )}
          </section>
        )
      })}
    </div>
  )
}

export function DataPage(props: { companyId: CompanyId; layer: DataLayer }) {
  const { companyId } = props
  const may = useMay()
  const layer =
    props.layer === DataLayer.enum.apps && !may.viewAppData ? DataLayer.enum.raw : props.layer
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-xl">
      <div className="flex min-w-0 flex-col gap-xs">
        <PageTitle>{DATA_TITLE}</PageTitle>
        <p className="max-w-message text-text-2">{DATA_INTRO}</p>
      </div>
      {layer === DataLayer.enum.raw &&
        (may.manageCopies ? (
          <SystemsLayer companyId={companyId} />
        ) : (
          <p className="font-medium">{NO_TABLE_OF_ROLE}</p>
        ))}
      {layer === DataLayer.enum.treated &&
        (may.proposeTreatment ? (
          <TreatedLayer companyId={companyId} />
        ) : (
          <p className="font-medium">{NO_TABLE_OF_ROLE}</p>
        ))}
      {layer === DataLayer.enum.business &&
        (may.proposeTreatment ? (
          <BusinessLayer companyId={companyId} />
        ) : (
          <p className="font-medium">{NO_TABLE_OF_ROLE}</p>
        ))}
      {layer === DataLayer.enum.apps && <AppsLayer companyId={companyId} />}
    </div>
  )
}
