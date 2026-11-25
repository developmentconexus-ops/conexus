import type { Connection } from '@conexus/hub-api'

/** The company's connections that work: each one is a group of the lake's tables in Dados. */
export function activeConnections(connections: readonly Connection[]): Connection[] {
  return connections.filter((connection) => connection.state === 'ACTIVE')
}
