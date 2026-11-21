import assert from 'node:assert/strict'
import type { Catalog, CatalogTable } from './company-data.ts'
import { Described } from './company-data.ts'
import type { DataWorld } from './company-data-world.ts'
import type { ConnectionId } from './connectors.ts'
import { OperationId } from './tools.ts'

export async function catalogOf(world: DataWorld): Promise<Catalog> {
  const described = Described.parse(await world.sources.catalog({}))
  assert.equal(described.kind, 'CATALOG')
  return described
}

function operationOf({ kept: { source } }: CatalogTable): string | null {
  return source.kind === 'OPERATION' ? source.operation : null
}

export function namedConnections({ kept }: CatalogTable): ConnectionId[] {
  return kept.sources.flatMap((one) => (one.kind === 'NAMED' ? [one.connection.id] : []))
}

export function keptInput({
  kept: { source },
}: CatalogTable): Readonly<Record<string, unknown>> | null {
  return source.kind === 'OPERATION' ? source.input : null
}

/** What the laws find in a world's catalog: the copy of a read with a fixed input, a read no copy keeps, a copy of a query and an action. */
export async function fixturesOf(world: DataWorld) {
  const catalog = await catalogOf(world)
  const table = catalog.tables.find((one) => Object.keys(keptInput(one) ?? {}).length > 0)
  assert.ok(table && table.kept.source.kind === 'OPERATION', 'a copy of a read with a fixed input')
  const connection = namedConnections(table)[0]
  assert.ok(connection, 'the connection the copy reads')
  const { operation, input } = table.kept.source
  const copied = { connection, operation: OperationId.parse(operation), input }
  const live = catalog.systems
    .flatMap((system) => system.reads.map((read) => ({ ...read, connection: system.connection })))
    .find((read) => !catalog.tables.some((one) => operationOf(one) === read.operation))
  assert.ok(live, 'a read no copy serves')
  const query = catalog.tables.find((one) => one.kept.source.kind === 'QUERY')
  assert.ok(query, 'a copy that copies no read')
  const system = catalog.systems.find((one) => one.actions.length > 0)
  const [declared] = system?.actions ?? []
  assert.ok(system && declared, 'a system with an action')
  const action = { connection: system.connection, operation: OperationId.parse(declared.operation) }
  const liveRead = {
    connection: live.connection,
    operation: OperationId.parse(live.operation),
    input: world.inputs.live,
  }
  return { catalog, table, copied, live: liveRead, query, action }
}
