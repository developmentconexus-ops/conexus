import type { Connection, ConnectorEntry, LakeTableSummary } from '@conexus/hub-api'

/**
 * The connections that are a group of Dados: the ones that work and that the Hub says can copy to
 * the lake (`lakeUnavailable`, the rule the connection's own page follows), and any other that
 * still has a table in the lake.
 */
export function connectionsOfData(
  connections: readonly Connection[],
  connectors: readonly ConnectorEntry[],
  tables: readonly LakeTableSummary[],
): Connection[] {
  return connections.filter(
    (connection) =>
      (connection.state === 'ACTIVE' &&
        connectors.find((one) => one.id === connection.connector)?.lakeUnavailable === null) ||
      tables.some((table) => table.connection.id === connection.id),
  )
}
