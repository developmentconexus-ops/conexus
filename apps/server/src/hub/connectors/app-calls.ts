import type { ConnectorAnswer } from '@conexus/app-contract'
import { connectorOf } from '@conexus/connectors'
import type { HostLabel } from '@conexus/hub-api'
import { CALL_DEADLINE_MS, ConnectionId } from '@conexus/hub-api'
import { and, asc, eq } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import type { ConnectorCall } from '../apps/public.ts'
import { readOf } from './grants.ts'
import { readThrough } from './read.ts'
import type { Deps } from './rows.ts'
import { scopeOf, usable } from './rows.ts'
import { connection, projectConnection } from './tables.ts'
import { openedIn } from './testing.ts'

/** What the apps' door gives of a call: who, the version the session gets and its manifest. */
export type AppDoorPort = (input: { host: HostLabel; headers: Headers }) => Promise<ConnectorCall>

type Call = Readonly<{
  host: HostLabel
  headers: Headers
  body: Readonly<{
    connector: string
    operation: string
    connection: string | null
    input: unknown
    deadlineMs: number
  }>
}>

const NOT_GRANTED: ConnectorAnswer = { kind: 'NOT_GRANTED' }

/** The Projeto's connections of a connector that are ACTIVE, oldest first. */
function grantedTo(call: ConnectorCall, connector: string) {
  const { companyId, projectId } = call.ids
  const scope = scopeOf({ person: { id: call.caller.personId }, companyId })
  function rows(tx: ReadTx) {
    return tx
      .select({ id: connection.id, name: connection.name })
      .from(projectConnection)
      .innerJoin(connection, eq(connection.id, projectConnection.connectionId))
      .where(
        and(
          eq(projectConnection.projectId, projectId),
          eq(projectConnection.connectorId, connector),
          usable,
        ),
      )
      .orderBy(asc(connection.linkedAt))
  }
  return { scope, companyId, projectId, rows }
}

/**
 * The app's read through a connector (step 20): the app's session by the apps' door, then in one
 * short transaction the grant and the seal (D22), then the call with no connection held. Every
 * refusal of admission is the same NOT_GRANTED (S10): not declared by the version, not the kit's, not
 * a read, not released, ambiguous without a name, or a key that must be connected again.
 */
export function createAppCalls(deps: Deps, door: AppDoorPort) {
  return {
    async call(input: Call): Promise<ConnectorAnswer> {
      const { body } = input
      const call = await door(input)
      const declared = call.manifest.connectors?.find((one) => one.connector === body.connector)
      const connector = connectorOf(body.connector)
      const operation = connector === undefined ? undefined : readOf(connector, body.operation)
      if (
        declared === undefined ||
        !declared.operations.includes(body.operation) ||
        connector === undefined ||
        operation === undefined
      )
        return NOT_GRANTED
      const { scope, companyId, projectId, rows } = grantedTo(call, connector.id)
      const opened = await deps.database.read(scope, async (tx) => {
        const found = await rows(tx)
        const chosen =
          body.connection === null
            ? found.length === 1
              ? found[0]
              : undefined
            : found.find((row) => row.name === body.connection)
        if (chosen === undefined) return undefined
        return openedIn(deps, tx, { companyId, connectionId: ConnectionId.parse(chosen.id) })
      })
      if (opened === undefined) return NOT_GRANTED
      return readThrough(deps, {
        by: 'app',
        ids: { companyId, projectId },
        viewer: { person: { id: call.caller.personId }, companyId },
        opened,
        operation,
        input: body.input,
        deadlineMs: Math.min(body.deadlineMs, CALL_DEADLINE_MS),
      })
    },

    /** The names the app may pass as `connection`; none for a connector its version did not declare. */
    async names(input: { host: HostLabel; headers: Headers; connector: string }) {
      const call = await door(input)
      if (call.manifest.connectors?.some((one) => one.connector === input.connector) !== true)
        return []
      const { scope, rows } = grantedTo(call, input.connector)
      const found = await deps.database.read(scope, (tx) => rows(tx))
      return found.map((row) => row.name)
    },
  }
}
export type AppCalls = ReturnType<typeof createAppCalls>
