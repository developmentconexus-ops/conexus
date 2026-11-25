import type { Connection, LakeTableSummary } from '@conexus/hub-api'

/** The connections that are a group of Dados: the ones that work and any other that still has a table in the lake. */
export function connectionsOfData(
  connections: readonly Connection[],
  tables: readonly LakeTableSummary[],
): Connection[] {
  return connections.filter(
    (connection) =>
      connection.state === 'ACTIVE' ||
      tables.some((table) => table.connection.id === connection.id),
  )
}
