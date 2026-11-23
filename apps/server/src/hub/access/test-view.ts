import type { CatalogSystem } from '@conexus/hub-api'
import { operationLeaf } from './reach.ts'
import type { AccessView } from './view.ts'
import { viewOf } from './view.ts'

/** The view of a door that lists these systems with every operation in reach. */
export function listing(systems: readonly CatalogSystem[]): AccessView {
  const allowed = new Set(
    systems.flatMap((system) =>
      [...system.reads, ...system.actions].map((each) =>
        operationLeaf(system.connection, each.operation),
      ),
    ),
  )
  return viewOf({ systems, allowed })
}
