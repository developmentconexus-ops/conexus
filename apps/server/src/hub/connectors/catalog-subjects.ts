import type { Connector } from '@conexus/connectors'
import type { ConnectorEntry } from '@conexus/hub-api'

const EFFECT_OF = { read: 'READ', write: 'WRITE', destructive: 'DESTROY' } as const

/** Every operation a connector has, the door's reads first: the one list a role's screen and a role's check both read (code C26). */
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
