import { ConnectionId } from '@conexus/hub-api'
import type { AccessSources } from '../access/public.ts'
import { offeredIn } from './builder-port.ts'
import { systemOf } from './catalog-subjects.ts'
import type { Deps } from './rows.ts'
import { connectorIn } from './rows.ts'

/** The connections a place offers. */
export function accessSystems(deps: Pick<Deps, 'catalog' | 'log'>): AccessSources['systems'] {
  return async (tx, { companyId, place }) => {
    const projectId = place.kind === 'PROJECT' ? place.projectId : undefined
    const rows = await offeredIn(
      tx,
      projectId === undefined ? { companyId } : { companyId, projectId },
    )
    return rows.flatMap((row) => {
      const connector = connectorIn(deps, row.connector)
      if (connector === undefined) {
        deps.log.error({ companyId, connector: row.connector }, 'DATA_CONNECTOR_UNKNOWN')
        return []
      }
      return [systemOf(connector, { id: ConnectionId.parse(row.id), name: row.name })]
    })
  }
}
