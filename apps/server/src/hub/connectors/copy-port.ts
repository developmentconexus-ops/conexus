import type { ConnectorId, CopyModel, CopyPage, PageInput } from '@conexus/connectors'
import { CONNECTORS, CopyPageSchema, connectorOf } from '@conexus/connectors'
import type { CompanyId, ConnectionId, PersonId } from '@conexus/hub-api'
import { ConnectorId as HubConnectorId, OperationId } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { readThrough } from './read.ts'
import type { Deps } from './rows.ts'
import { usable } from './rows.ts'
import { connection } from './tables.ts'
import { openedIn } from './testing.ts'

type CopySourceFailure =
  | 'COPY_SOURCE_REFUSED'
  | 'COPY_SOURCE_NEEDS_REAUTH'
  | 'COPY_SOURCE_UNREACHABLE'
  | 'COPY_SOURCE_UNREADABLE'

export type CopyRead =
  | Readonly<{ kind: 'PAGE'; page: CopyPage }>
  | Readonly<{ kind: 'FAILED'; code: CopySourceFailure }>
  /** The connection is gone, not ACTIVE, or of a connector that offers no copies. */
  | Readonly<{ kind: 'NO_CONNECTION' }>

type OfConnection = Readonly<{ companyId: CompanyId; connectionId: ConnectionId }>

function connectorOfRow(deps: Deps, input: OfConnection, personId: PersonId | null) {
  const scope = { kind: 'COMPANY', companyId: input.companyId, personId } as const
  return deps.database.read(scope, async (tx) => {
    const [row] = await tx
      .select({ connector: connection.connectorId })
      .from(connection)
      .where(and(eq(connection.id, input.connectionId), eq(connection.companyId, input.companyId)))
    return row === undefined ? undefined : connectorOf(row.connector)
  })
}

/**
 * The company's connection a copy is turned on from, read in the caller's transaction: its
 * connector when it is ACTIVE; none when the company has no such connection.
 */
export async function connectionForCopy(
  tx: ReadTx,
  input: OfConnection,
): Promise<{ kind: 'ACTIVE'; connectorId: HubConnectorId } | { kind: 'NOT_ACTIVE' } | undefined> {
  const [row] = await tx
    .select({ state: connection.state, connectorId: connection.connectorId })
    .from(connection)
    .where(and(eq(connection.id, input.connectionId), eq(connection.companyId, input.companyId)))
  if (row === undefined) return undefined
  return row.state === 'ACTIVE'
    ? { kind: 'ACTIVE', connectorId: HubConnectorId.parse(row.connectorId) }
    : { kind: 'NOT_ACTIVE' }
}

/** The connection opened for one page when it is ACTIVE and its connector reads copies; none otherwise. */
function openedForCopy(deps: Deps, input: OfConnection & { enabledBy: PersonId }) {
  const scope = { kind: 'COMPANY', companyId: input.companyId, personId: input.enabledBy } as const
  return deps.database.read(scope, async (tx) => {
    const [row] = await tx
      .select({ id: connection.id })
      .from(connection)
      .where(
        and(
          eq(connection.id, input.connectionId),
          eq(connection.companyId, input.companyId),
          usable,
        ),
      )
    if (row === undefined) return undefined
    try {
      const opened = await openedIn(deps, tx, input)
      const read = opened.connector.copy?.read
      return read === undefined ? undefined : { opened, read }
    } catch (error) {
      if (error instanceof Failure && error.code === 'CONNECTION_NOT_FOUND') return undefined
      throw error
    }
  })
}

/**
 * The copies' door to the outside (decision 0056): the templates of each connector, and one page
 * of a copy through the read every other reader takes, the connection's turn, its token, the
 * deadline and the log line. The copy speaks as a version that declares only the paged read.
 */
export function createCopyPort(deps: Deps) {
  return Object.freeze({
    async models(input: OfConnection): Promise<readonly CopyModel[] | undefined> {
      return (await connectorOfRow(deps, input, null))?.copy?.models
    },
    catalog(): readonly { connector: ConnectorId; model: CopyModel }[] {
      return CONNECTORS.flatMap((connector) =>
        (connector.copy?.models ?? []).map((model) => ({ connector: connector.id, model })),
      )
    },
    async readPage(
      input: OfConnection & { enabledBy: PersonId; input: PageInput; signal: AbortSignal },
    ): Promise<CopyRead> {
      const found = await openedForCopy(deps, input)
      if (found === undefined) return { kind: 'NO_CONNECTION' }
      const { opened, read } = found
      const answer = await readThrough(deps, {
        by: 'copy',
        ids: { companyId: input.companyId },
        viewer: { person: { id: input.enabledBy }, companyId: input.companyId },
        speaker: {
          kind: 'VERSION',
          declared: [{ connectionId: input.connectionId, operation: OperationId.parse(read.id) }],
        },
        opened,
        operation: read,
        input: input.input,
        deadlineMs: deps.callDeadlineMs,
        signal: input.signal,
      })
      switch (answer.kind) {
        case 'OK':
          return { kind: 'PAGE', page: CopyPageSchema.parse(answer.value) }
        case 'REFUSED':
        case 'NOT_IN_ROLE':
          return { kind: 'FAILED', code: 'COPY_SOURCE_REFUSED' }
        case 'AUTH_REFUSED':
          return { kind: 'FAILED', code: 'COPY_SOURCE_NEEDS_REAUTH' }
        case 'UNREACHABLE':
        case 'DEADLINE':
        case 'BUSY':
          return { kind: 'FAILED', code: 'COPY_SOURCE_UNREACHABLE' }
        case 'UNREADABLE':
          return { kind: 'FAILED', code: 'COPY_SOURCE_UNREADABLE' }
        default:
          return answer satisfies never
      }
    },
  })
}
