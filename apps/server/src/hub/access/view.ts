import type { CatalogSystem, CatalogTable } from '@conexus/hub-api'
import { OperationEffect } from '@conexus/hub-api'
import type { LeafKey, Snapshot, Verdict } from './model.ts'
import { operationLeaf, reach } from './reach.ts'

type Listed = { table: readonly CatalogTable[]; system: readonly CatalogSystem[] }

/** What the door says to one principal: whether a leaf may be used so, and what it lists. */
export type AccessView = Readonly<{
  may(leaf: LeafKey, effect: OperationEffect): Verdict
  list<K extends keyof Listed>(kind: K): Listed[K]
}>

function rankOf(effect: OperationEffect): number {
  return OperationEffect.options.indexOf(effect)
}

/** The view of one snapshot: a system lists only its operations in reach, and leaves when none is. */
export function viewOf(snapshot: Snapshot): AccessView {
  const reached = reach(snapshot)
  const systems = snapshot.systems.flatMap((system) => {
    function inReach({ operation }: { operation: string }) {
      return reached.has(operationLeaf(system.connection, operation))
    }
    const reads = system.reads.filter(inReach)
    const actions = system.actions.filter(inReach)
    return reads.length + actions.length === 0 ? [] : [{ ...system, reads, actions }]
  })
  const listed: Listed = { table: snapshot.tables, system: systems }
  return {
    may(leaf, effect) {
      const ceiling = reached.get(leaf)
      if (ceiling === undefined) return { kind: 'REFUSED', reason: 'OUT_OF_REACH' }
      if (rankOf(effect) > rankOf(ceiling)) return { kind: 'REFUSED', reason: 'ABOVE_CEILING' }
      return { kind: 'ALLOWED', ceiling }
    },
    list: (kind) => listed[kind],
  }
}
