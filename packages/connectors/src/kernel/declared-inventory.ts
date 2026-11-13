import type { Connector } from './definition.ts'
import { inProbeOrder } from './definition.ts'
import type { InventoryEntry } from './inventory.ts'

/** The entries of a connector with no dictionary: its declared operations, no call. */
export function declaredInventory(connector: Connector): InventoryEntry[] {
  return [...inProbeOrder(connector), ...(connector.writes ?? [])].map((operation) => ({
    kind: 'OPERATION',
    name: operation.id,
    type: operation.class,
    label: operation.label.slice(0, 200),
    custom: false,
  }))
}
