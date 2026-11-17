import type { CatalogSystem, CatalogTable } from '@conexus/hub-api'
import { operationLeaf } from './reach.ts'
import type { AccessView } from './view.ts'
import { viewOf } from './view.ts'

/** The view of a door that lists these systems with every operation in reach, and these tables. */
export function listing(
  systems: readonly CatalogSystem[],
  tables: readonly CatalogTable[] = [],
): AccessView {
  const allowed = new Set(
    systems.flatMap((system) =>
      [...system.reads, ...system.actions].map((each) =>
        operationLeaf(system.connection, each.operation),
      ),
    ),
  )
  return viewOf({ systems, tables, allowed })
}
