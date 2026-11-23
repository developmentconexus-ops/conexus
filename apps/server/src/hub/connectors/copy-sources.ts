import type { CompanyId, ConnectionId } from '@conexus/hub-api'
import { ConnectorId as HubConnectorId } from '@conexus/hub-api'
import { and, eq, inArray } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { connection } from './tables.ts'

/** The name and connector of each of the company's connections named; one gone is left out. */
export async function connectionNamesOf(
  tx: ReadTx,
  input: { companyId: CompanyId; ids: readonly ConnectionId[] },
): Promise<Map<string, { name: string; connector: HubConnectorId }>> {
  if (input.ids.length === 0) return new Map()
  const rows = await tx
    .select({ id: connection.id, name: connection.name, connector: connection.connectorId })
    .from(connection)
    .where(and(eq(connection.companyId, input.companyId), inArray(connection.id, [...input.ids])))
  return new Map(
    rows.map((row) => [row.id, { name: row.name, connector: HubConnectorId.parse(row.connector) }]),
  )
}
