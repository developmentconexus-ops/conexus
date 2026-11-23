import assert from 'node:assert/strict'
import type { Catalog } from './company-data.ts'
import { Described } from './company-data.ts'
import type { DataWorld } from './company-data-world.ts'
import { OperationId } from './tools.ts'

/** A query that names a table: the catalog lists none, so it is outside the catalog. */
export const OUTSIDE_QUERY = 'select numero from pedidos'

async function catalogOf(world: DataWorld): Promise<Catalog> {
  const described = Described.parse(await world.sources.catalog({}))
  assert.equal(described.kind, 'CATALOG')
  return described
}

/** What the laws find in a world's catalog: a read and an action. */
export async function fixturesOf(world: DataWorld) {
  const catalog = await catalogOf(world)
  const reading = catalog.systems.find((one) => one.reads.length > 0)
  const [read] = reading?.reads ?? []
  assert.ok(reading && read, 'a system with a read')
  const system = catalog.systems.find((one) => one.actions.length > 0)
  const [declared] = system?.actions ?? []
  assert.ok(system && declared, 'a system with an action')
  const action = { connection: system.connection, operation: OperationId.parse(declared.operation) }
  const live = {
    connection: reading.connection,
    operation: OperationId.parse(read.operation),
    input: world.liveInput,
  }
  return { catalog, live, action }
}
