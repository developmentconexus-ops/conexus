import type { Connector } from '@conexus/connectors'
import type { CatalogSystem, ConnectionId, ConnectorEntry } from '@conexus/hub-api'
import { ConnectorId } from '@conexus/hub-api'

const EFFECT_OF = { read: 'READ', write: 'WRITE', destructive: 'DESTROY' } as const

/** The door's reads first, then the connector's reads, without its writes; the role kit adds those (code C26). */
export function operationsOf(connector: Connector) {
  return [...Object.values(connector.readDoor ?? {}), ...connector.operations]
}

/** The kit's subjects in its order, each with its operations; the door's reads sit under their subject, marked. */
export function subjectsOf(connector: Connector): ConnectorEntry['subjects'] {
  const door = new Set(Object.values(connector.readDoor ?? {}).map((operation) => operation.id))
  const operations = operationsOf(connector)
  return Object.entries(connector.subjects).map(([id, label]) => ({
    id,
    label,
    operations: operations
      .filter((operation) => operation.subject === id)
      .map((operation) => ({
        id: operation.id,
        label: operation.label,
        summary: operation.summary,
        effect: EFFECT_OF[operation.class],
        door: door.has(operation.id),
      })),
  }))
}

function entryOf({ id, label, summary }: { id: string; label: string; summary: string }) {
  return { operation: id, label, summary }
}

/** A connection as the data contract states it: what the system reads and what it does, by the kit's declaration. */
export function systemOf(
  connector: Connector,
  row: { id: ConnectionId; name: string },
): CatalogSystem {
  return {
    connection: row.id,
    connector: ConnectorId.parse(connector.id),
    name: row.name,
    reads: operationsOf(connector)
      .filter((operation) => operation.class === 'read')
      .map(entryOf),
    actions: (connector.writes ?? []).map((operation) => ({
      ...entryOf(operation),
      effect: EFFECT_OF[operation.class],
    })),
  }
}

/** A connector as the screen offers it: its fields by their labels, help and visibility. */
export function connectorEntryOf(connector: Connector): ConnectorEntry {
  return {
    id: connector.id,
    name: connector.name,
    version: connector.version,
    category: connector.category,
    summary: connector.summary,
    logo: connector.logo,
    subjects: subjectsOf(connector),
    auth: connector.auth.kind,
    fields:
      connector.auth.kind === 'client_credentials'
        ? Object.entries(connector.auth.fields).map(([name, field]) => ({ name, ...field }))
        : [],
  }
}
