import type { ConnectionState } from '@conexus/hub-api'
import { ConnectionId } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { AccessSources } from '../access/public.ts'
import { givenTo, offeredIn } from './builder-port.ts'
import { systemOf } from './catalog-subjects.ts'
import type { Deps } from './rows.ts'
import { connectorIn } from './rows.ts'
import { connection } from './tables.ts'

/** The connections a place offers and the state of each the place was given. */
export function accessSystems(deps: Pick<Deps, 'catalog' | 'log'>): AccessSources['systems'] {
  return async (tx, { companyId, place }) => {
    const projectId = place.kind === 'PROJECT' ? place.projectId : undefined
    const rows = await offeredIn(
      tx,
      projectId === undefined ? { companyId } : { companyId, projectId },
    )
    const systems = rows.flatMap((row) => {
      const connector = connectorIn(deps, row.connector)
      if (connector === undefined) {
        deps.log.error({ companyId, connector: row.connector }, 'DATA_CONNECTOR_UNKNOWN')
        return []
      }
      return [systemOf(connector, { id: ConnectionId.parse(row.id), name: row.name })]
    })
    const states = await tx
      .select({ id: connection.id, state: connection.state })
      .from(connection)
      .where(
        and(
          eq(connection.companyId, companyId),
          projectId === undefined ? undefined : givenTo(tx, projectId),
        ),
      )
    const given = new Map<ConnectionId, ConnectionState>(
      states.map((row) => [ConnectionId.parse(row.id), row.state]),
    )
    return { systems, given }
  }
}
