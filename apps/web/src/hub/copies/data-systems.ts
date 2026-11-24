import type { Connection } from '@conexus/hub-api'

export type System = { connector: string; accounts: Set<string> }

/** The company's systems: each connector an active connection links, with its connections' names. */
export function systemsOf(connections: readonly Connection[]): System[] {
  const found = new Map<string, System>()
  for (const connection of connections) {
    if (connection.state !== 'ACTIVE') continue
    const known = found.get(connection.connector)
    const system = known ?? { connector: connection.connector, accounts: new Set<string>() }
    system.accounts.add(connection.name)
    found.set(connection.connector, system)
  }
  return [...found.values()]
}
