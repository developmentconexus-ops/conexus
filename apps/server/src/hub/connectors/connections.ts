import { randomUUID } from 'node:crypto'
import type { Connector } from '@conexus/connectors'
import { CONNECTORS, connectorOf, inProbeOrder } from '@conexus/connectors'
import type {
  CompanyId,
  Connection,
  ConnectionDetail,
  ConnectionList,
  ConnectorEntry,
} from '@conexus/hub-api'
import { ConnectionId, ConnectionName, TestCheck } from '@conexus/hub-api'
import { and, asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { ReadTx } from '../../platform/database.ts'
import { transactionLock, violatedConstraint } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { Credential, open, seal } from '../../platform/seal.ts'
import type { Deps, OfConnection, Viewer } from './rows.ts'
import { admitted, columns, ofCompany, scopeOf, sealContext, sealedOf, viewOf } from './rows.ts'
import { connection } from './tables.ts'

const NAME_KEY = 'connection_name_key'

function entryOf(connector: Connector): ConnectorEntry {
  return {
    id: connector.id,
    name: connector.name,
    version: connector.version,
    category: connector.category,
    summary: connector.summary,
    logo: connector.logo,
    reads: inProbeOrder(connector).length,
    fields: Object.entries(connector.auth.fields).map(([name, field]) => ({ name, ...field })),
  }
}

/** Every member reads the catalog and the company's connections; nothing of a credential (S41). */
export function list(deps: Deps, viewer: Viewer): Promise<ConnectionList> {
  return deps.database.read(scopeOf(viewer), async (tx) => {
    const member = await admitted(deps, tx, viewer, 'readConnections')
    const rows = await tx
      .select(columns)
      .from(connection)
      .where(eq(connection.companyId, viewer.companyId))
      .orderBy(asc(connection.connectorId), asc(connection.linkedAt))
    return {
      connectors: CONNECTORS.map(entryOf),
      connections: rows.map(viewOf),
      mayManage: deps.identity.allows(member.role, 'manageConnections'),
    }
  })
}

type Link = Viewer & {
  connector: string
  name: string
  credential: Record<string, string>
  attemptKey: string
}

/**
 * Links the company to a connector (criterion 9): the attempt's lock, the admission, the fields by
 * the connector's own schema, then a replay compared with the sealed values (code C37). Nothing is
 * called: linking only seals and keeps.
 */
export async function link(deps: Deps, input: Link) {
  // Before the transaction opens: a name the company must fix needs no lock and no admission.
  const name = ConnectionName.safeParse(input.name)
  if (!name.success) throw new Failure('CONNECTION_NAME_INVALID')
  return deps.database.command(scopeOf(input), async (tx) => {
    await transactionLock(tx, `conexus.connection:${input.companyId}:${input.attemptKey}`)
    await admitted(deps, tx, input, 'manageConnections')
    const connector = connectorOf(input.connector)
    if (connector === undefined) throw new Failure('CONNECTOR_UNKNOWN')
    const parsed = connector.auth.credential.safeParse(
      Object.fromEntries(
        Object.entries(input.credential).map(([name, value]) => [name, value.trim()]),
      ),
    )
    if (!parsed.success) throw new Failure('CONNECTION_CREDENTIAL_INVALID')
    const [found] = await tx
      .select({ id: connection.id, connector: connection.connectorId, name: connection.name })
      .from(connection)
      .where(
        and(eq(connection.companyId, input.companyId), eq(connection.attemptKey, input.attemptKey)),
      )
    if (found !== undefined) {
      const id = ConnectionId.parse(found.id)
      const same =
        found.connector === connector.id &&
        found.name === name.data &&
        (await sealedText(deps, tx, { id, companyId: input.companyId, connector })) ===
          JSON.stringify(parsed.data)
      if (!same) throw new Failure('IDEMPOTENCY_CONFLICT')
      return { connection: await viewIn(tx, input, id), created: false }
    }
    const id = ConnectionId.parse(randomUUID())
    const sealed = seal(
      deps.sealKeys,
      sealContext({ id, companyId: input.companyId, connector }),
      Credential.parse(JSON.stringify(parsed.data)),
    )
    try {
      await tx.insert(connection).values({
        id,
        companyId: input.companyId,
        connectorId: connector.id,
        name: name.data,
        connectorVersion: connector.version,
        state: 'NEW',
        sealed: Buffer.from(sealed.blob),
        keyId: sealed.keyId,
        linkedBy: input.person.id,
        linkedAt: sql`statement_timestamp()`,
        attemptKey: input.attemptKey,
      })
    } catch (error) {
      if (violatedConstraint(error) === NAME_KEY)
        throw new Failure('CONNECTION_NAME_TAKEN', { cause: error })
      throw error
    }
    return { connection: await viewIn(tx, input, id), created: true }
  })
}

/** The sealed values as they were sealed, the connector's fields in its own order, to compare a replay. */
async function sealedText(
  deps: Deps,
  tx: ReadTx,
  row: { id: ConnectionId; companyId: CompanyId; connector: Connector },
): Promise<string> {
  return open(deps.sealKeys, sealContext(row), await sealedOf(tx, row.id)).reveal()
}

async function viewIn(tx: ReadTx, viewer: Viewer, id: ConnectionId): Promise<Connection> {
  const [row] = await tx.select(columns).from(connection).where(ofCompany(viewer, id))
  if (row === undefined) throw new Failure('CONNECTION_NOT_FOUND')
  return viewOf(row)
}

/** Removes a connection and its seal; removing one already gone answers the same (criterion 13). */
export function unlink(deps: Deps, input: Viewer & { connectionId: ConnectionId }) {
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    const removed = await tx
      .delete(connection)
      .where(ofCompany(input, input.connectionId))
      .returning({ id: connection.id })
    return { removed: removed.length > 0 }
  })
}

/** One connection and the items of its last working test; one that no longer matches TestCheck is read as no test (never an invented item). */
export function detail(deps: Deps, input: OfConnection): Promise<ConnectionDetail> {
  return deps.database.read(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'readConnections')
    const [row] = await tx
      .select({ ...columns, lastTest: connection.lastTest })
      .from(connection)
      .where(ofCompany(input, input.connectionId))
    if (row === undefined) throw new Failure('CONNECTION_NOT_FOUND')
    const lastTest = z.array(TestCheck).safeParse(row.lastTest)
    if (row.lastTest !== null && !lastTest.success)
      deps.log.error(
        { connectionId: row.id, kind: 'last test shape' },
        'CONNECTION_LAST_TEST_UNREAD',
      )
    return { connection: viewOf(row), lastTest: lastTest.success ? lastTest.data : null }
  })
}
