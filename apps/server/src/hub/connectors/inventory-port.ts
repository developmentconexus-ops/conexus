import type { ConnectorId, InventoryEntry, InventoryPage } from '@conexus/connectors'
import { declaredInventory, InventoryPageSchema } from '@conexus/connectors'
import { PersonId } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { CopyRefusal, OfConnection } from './copy-port.ts'
import { openedForCopy, readAsCopy } from './copy-port.ts'
import type { Deps } from './rows.ts'
import { connectorIn } from './rows.ts'
import { connection } from './tables.ts'

/** What the Ontology needs of a connection to read its inventory: who linked it, and what its connector declares. */
export type InventorySource = Readonly<{
  linkedBy: PersonId
  connector: ConnectorId
  /** The connector reads a dictionary; when false, `declared` is the whole inventory. */
  dictionary: boolean
  declared: readonly InventoryEntry[]
}>

/** One page of the system's dictionary as the run keeps it. */
export type InventoryRead =
  | Readonly<{ kind: 'PAGE'; page: InventoryPage }>
  | Readonly<{ kind: 'REFUSED'; refusal: CopyRefusal }>
  /** The connection is gone. */
  | Readonly<{ kind: 'NO_CONNECTION' }>
  /** The connector's lane passed its deadline before the call: nothing was asked. */
  | Readonly<{ kind: 'IN_LINE' }>

/**
 * The connector's inventory read as the Ontology's run takes it (data D22: no transaction is open
 * while the system answers). It speaks as the copies' reads do, a version that declares only that
 * read, with the person who linked the connection as the viewer.
 */
export function createInventoryPort(deps: Deps) {
  return Object.freeze({
    async sourceOf(input: OfConnection): Promise<InventorySource | undefined> {
      const scope = { kind: 'COMPANY', companyId: input.companyId, personId: null } as const
      const [row] = await deps.database.read(scope, (tx) =>
        tx
          .select({ connector: connection.connectorId, linkedBy: connection.linkedBy })
          .from(connection)
          .where(
            and(eq(connection.id, input.connectionId), eq(connection.companyId, input.companyId)),
          ),
      )
      const connector = row === undefined ? undefined : connectorIn(deps, row.connector)
      if (row === undefined || connector === undefined) return undefined
      return {
        linkedBy: PersonId.parse(row.linkedBy),
        connector: connector.id,
        dictionary: connector.inventory !== undefined,
        declared: declaredInventory(connector),
      }
    },
    async page(
      input: OfConnection & {
        enabledBy: PersonId
        cursor: string | null
        limit: number
        signal: AbortSignal
      },
    ): Promise<InventoryRead> {
      const opened = await openedForCopy(deps, input, null)
      const read = opened?.connector.inventory?.read
      if (opened === undefined || read === undefined) return { kind: 'NO_CONNECTION' }
      const value = { cursor: input.cursor, limit: input.limit }
      const answer = await readAsCopy(deps, { input, opened, operation: read, value })
      if (answer.kind === 'IN_LINE') return answer
      if (answer.kind === 'OK')
        return { kind: 'PAGE', page: InventoryPageSchema.parse(answer.value) }
      return { kind: 'REFUSED', refusal: answer }
    },
  })
}
