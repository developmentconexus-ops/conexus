import type { CatalogSystem, ConnectionState } from '@conexus/hub-api'
import { ConnectionId } from '@conexus/hub-api'
import { and, eq, inArray } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { offeredIn } from './builder-port.ts'
import { systemOf } from './catalog-subjects.ts'
import type { Deps } from './rows.ts'
import { connectorIn } from './rows.ts'
import type { SessionScope } from './scope.ts'
import { idsOf } from './scope.ts'
import { connection, projectConnection } from './tables.ts'

/** The connections the scope's place offers, as the data contract states them; admits nobody: the caller did, in its transaction. */
export async function catalogSystemsOf(
  deps: Pick<Deps, 'catalog' | 'log'>,
  tx: ReadTx,
  scope: SessionScope,
): Promise<CatalogSystem[]> {
  const rows = await offeredIn(tx, idsOf(scope))
  return rows.flatMap((row) => {
    const connector = connectorIn(deps, row.connector)
    if (connector === undefined) {
      deps.log.error(
        { companyId: scope.companyId, connector: row.connector },
        'DATA_CONNECTOR_UNKNOWN',
      )
      return []
    }
    return [systemOf(connector, { id: ConnectionId.parse(row.id), name: row.name })]
  })
}

/** The state of each connection the scope's place was given, in any state; admits nobody: the caller did, in its transaction. */
export async function catalogSourcesOf(
  tx: ReadTx,
  scope: SessionScope,
): Promise<ReadonlyMap<ConnectionId, ConnectionState>> {
  const { companyId, place } = scope
  const rows = await tx
    .select({ id: connection.id, state: connection.state })
    .from(connection)
    .where(
      and(
        eq(connection.companyId, companyId),
        place.kind === 'PROJECT'
          ? inArray(
              connection.id,
              tx
                .select({ id: projectConnection.connectionId })
                .from(projectConnection)
                .where(eq(projectConnection.projectId, place.projectId)),
            )
          : undefined,
      ),
    )
  return new Map(rows.map((row) => [ConnectionId.parse(row.id), row.state]))
}
