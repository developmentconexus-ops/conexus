import type { ConnectionId, OperationEffect } from '@conexus/hub-api'
import type { Reach, Snapshot } from './model.ts'
import { LeafKey } from './model.ts'

export function operationLeaf(connection: ConnectionId, operation: string): LeafKey {
  return LeafKey.parse(`operation:${connection}:${operation}`)
}

/** What the snapshot puts in reach: every allowed operation up to its effect. */
export function reach(snapshot: Snapshot): Reach {
  const reached = new Map<LeafKey, OperationEffect>()
  for (const system of snapshot.systems) {
    const operations = [
      ...system.reads.map((read) => ({ ...read, effect: 'READ' as const })),
      ...system.actions,
    ]
    for (const { operation, effect } of operations) {
      const leaf = operationLeaf(system.connection, operation)
      if (snapshot.allowed.has(leaf)) reached.set(leaf, effect)
    }
  }
  return reached
}
