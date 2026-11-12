import { AccountRef, connectorOf } from '@conexus/connectors'
import type { CompanyId, ConnectionId, PersonId } from '@conexus/hub-api'
import { ConnectorId as HubConnectorId, OperationId } from '@conexus/hub-api'
import { and, eq, inArray } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { roleOfSpeaker, speakerOf } from '../identity/public.ts'
import type { NotInRole } from './read.ts'
import { operationLabel } from './role-kit.ts'
import type { Deps } from './rows.ts'
import { lackedDoorRead } from './speaking.ts'
import { connection } from './tables.ts'

type OfConnection = Readonly<{ companyId: CompanyId; connectionId: ConnectionId }>

/**
 * The company's connection a copy is turned on from, read in the caller's transaction: its
 * connector and its account (none on a connector whose account is `none`) when it is ACTIVE; none
 * when the company has no such connection.
 */
export async function connectionForCopy(
  tx: ReadTx,
  input: OfConnection,
): Promise<
  | { kind: 'ACTIVE'; connectorId: HubConnectorId; accountRef: AccountRef | null }
  | { kind: 'NOT_ACTIVE' }
  | undefined
> {
  const [row] = await tx
    .select({
      state: connection.state,
      connectorId: connection.connectorId,
      accountRef: connection.accountRef,
    })
    .from(connection)
    .where(and(eq(connection.id, input.connectionId), eq(connection.companyId, input.companyId)))
  if (row === undefined) return undefined
  if (row.state !== 'ACTIVE') return { kind: 'NOT_ACTIVE' }
  const accountRef = row.accountRef === null ? null : AccountRef.parse(row.accountRef)
  return { kind: 'ACTIVE', connectorId: HubConnectorId.parse(row.connectorId), accountRef }
}

/**
 * The label of the first read of the connection's read door the person's role does not hold; none
 * when the role holds them all. The speaker is read in the caller's transaction; the role's answer
 * (`mayUseEach`) opens a transaction of its own. Who turns a proposal on must be able to read what
 * it copies (Capacidade 3).
 */
export async function lackedReadOf(
  deps: Pick<Deps, 'identity'>,
  tx: ReadTx,
  input: OfConnection & { connectorId: HubConnectorId; personId: PersonId },
): Promise<string | undefined> {
  const connector = connectorOf(input.connectorId)
  const first = Object.values(connector?.readDoor ?? {})[0]
  const speaker = await speakerOf(tx, input.companyId, input.personId)
  if (connector === undefined || speaker === undefined)
    return first === undefined ? input.connectorId : operationLabel(input.connectorId, first.id)
  const lacked = await lackedDoorRead(deps, input.companyId, speaker, {
    connectionId: input.connectionId,
    connector,
  })
  return lacked === undefined ? undefined : operationLabel(input.connectorId, lacked.id)
}

/**
 * Whether the person's role uses the list read a version 2 copy reads, on each of its connections:
 * one `mayUseEach` entry per connection (never `ungrantedBy`, which resolves one connection per
 * connector). Proposing and turning a proposal on ask it; the refusal names the read by its label.
 */
export async function lackedSourceReadOf(
  deps: Pick<Deps, 'identity'>,
  tx: ReadTx,
  input: {
    companyId: CompanyId
    personId: PersonId
    connectorId: HubConnectorId
    operation: string
    connections: readonly ConnectionId[]
  },
): Promise<NotInRole | undefined> {
  const label = operationLabel(input.connectorId, input.operation)
  const speaker = await speakerOf(tx, input.companyId, input.personId)
  if (speaker === undefined) return { kind: 'NOT_IN_ROLE', role: null, operation: label }
  const operationId = OperationId.parse(input.operation)
  const answers = await deps.identity.mayUseEach(
    input.companyId,
    speaker,
    input.connections.map((connectionId) => ({
      connectionId,
      connectorId: input.connectorId,
      operationId,
    })),
  )
  if (answers.every(Boolean)) return undefined
  return { kind: 'NOT_IN_ROLE', role: roleOfSpeaker(speaker), operation: label }
}

/** The name and connector of each of the company's connections named; one gone is left out. */
export async function connectionNamesOf(
  tx: ReadTx,
  input: { companyId: CompanyId; ids: readonly ConnectionId[] },
): Promise<Map<string, { name: string; connector: HubConnectorId }>> {
  if (input.ids.length === 0) return new Map()
  const rows = await tx
    .select({ id: connection.id, name: connection.name, connector: connection.connectorId })
    .from(connection)
    .where(and(eq(connection.companyId, input.companyId), inArray(connection.id, [...input.ids])))
  return new Map(
    rows.map((row) => [row.id, { name: row.name, connector: HubConnectorId.parse(row.connector) }]),
  )
}
