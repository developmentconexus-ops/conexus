import type { CatalogSystem } from '@conexus/hub-api'
import { ConnectionId } from '@conexus/hub-api'
import type { ReadTx } from '../../platform/database.ts'
import { offeredIn } from './builder-port.ts'
import { systemOf } from './catalog-subjects.ts'
import type { Deps } from './rows.ts'
import { connectorIn } from './rows.ts'
import type { SessionScope } from './scope.ts'
import { idsOf } from './scope.ts'

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
