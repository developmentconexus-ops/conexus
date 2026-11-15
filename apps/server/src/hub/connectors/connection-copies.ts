import { viewIn } from './connections.ts'
import type { Deps, OfConnection } from './rows.ts'
import { admitted, scopeOf } from './rows.ts'

/** The copies that read the connection, as Desligar shows them before the click; admitted as Desligar is. */
export async function copiesOfConnection(deps: Deps, input: OfConnection) {
  await deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    await viewIn(tx, input, input.connectionId)
  })
  const { companyId, connectionId } = input
  return deps.copies().copiesOf({ companyId, personId: input.person.id, connectionId })
}
