import { randomUUID } from 'node:crypto'
import type { AppKeys, ClientCredentialsAuth, Connector, Native } from '@conexus/connectors'
import { CONNECTORS, connectorOf } from '@conexus/connectors'
import type {
  CompanyId,
  Connection,
  ConnectionDetail,
  ConnectionList,
  ConnectorEntry,
  Revocation,
} from '@conexus/hub-api'
import { ConnectionId, ConnectionName } from '@conexus/hub-api'
import { and, asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { ReadTx } from '../../platform/database.ts'
import { transactionLock, violatedConstraint } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { Credential, open, seal } from '../../platform/seal.ts'
import type { OAuthConnector } from './apps.ts'
import { appKeysOf, isOAuth } from './apps.ts'
import type { BearerToken, OpenedConnection } from './executor.ts'
import type { Deps, OfConnection, Viewer } from './rows.ts'
import { admitted, columns, ofCompany, scopeOf, sealContext, sealedOf, viewOf } from './rows.ts'
import { connection } from './tables.ts'
import { opened } from './testing.ts'
import { accessFor, statusOf } from './tokens.ts'

const NAME_KEY = 'connection_name_key'

function entryOf(connector: Connector): ConnectorEntry {
  return {
    id: connector.id,
    name: connector.name,
    version: connector.version,
    category: connector.category,
    summary: connector.summary,
    logo: connector.logo,
    auth: connector.auth.kind,
    fields:
      connector.auth.kind === 'client_credentials'
        ? Object.entries(connector.auth.fields).map(([name, field]) => ({ name, ...field }))
        : [],
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

/** The connector and its pasted-fields login; an OAuth connector links through its sign-in (sign-ins.ts). */
function pastedLogin(id: string) {
  const connector = connectorOf(id)
  if (connector?.auth.kind !== 'client_credentials') throw new Failure('CONNECTOR_UNKNOWN')
  return { connector, auth: connector.auth }
}

/** The pasted fields, trimmed, by the connector's own schema. */
function pastedOf(auth: ClientCredentialsAuth, credential: Record<string, string>) {
  const parsed = auth.credential.safeParse(
    Object.fromEntries(Object.entries(credential).map(([name, value]) => [name, value.trim()])),
  )
  if (!parsed.success) throw new Failure('CONNECTION_CREDENTIAL_INVALID')
  return parsed.data
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
    const { connector, auth } = pastedLogin(input.connector)
    const pasted = pastedOf(auth, input.credential)
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
          JSON.stringify(pasted)
      if (!same) throw new Failure('IDEMPOTENCY_CONFLICT')
      return { connection: await viewIn(tx, input, id), created: false }
    }
    const id = ConnectionId.parse(randomUUID())
    const sealed = seal(
      deps.sealKeys,
      sealContext({ id, companyId: input.companyId, connector }),
      Credential.parse(JSON.stringify(pasted)),
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

/**
 * Conectar de novo for pasted fields (criterion 17): new fields sealed to the same row, NEW, a new
 * revision, who linked and when, and no last test. A Testar still running on the old fields
 * compares `linked_at` and writes nothing over it.
 */
export function reconnect(
  deps: Deps,
  input: OfConnection & { credential: Record<string, string> },
): Promise<Connection> {
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    const [row] = await tx
      .select({ connector: connection.connectorId })
      .from(connection)
      .where(ofCompany(input, input.connectionId))
    if (row === undefined) throw new Failure('CONNECTION_NOT_FOUND')
    const { connector, auth } = pastedLogin(row.connector)
    const pasted = pastedOf(auth, input.credential)
    const id = input.connectionId
    const sealed = seal(
      deps.sealKeys,
      sealContext({ id, companyId: input.companyId, connector }),
      Credential.parse(JSON.stringify(pasted)),
    )
    const [updated] = await tx
      .update(connection)
      .set({
        sealed: Buffer.from(sealed.blob),
        keyId: sealed.keyId,
        state: 'NEW',
        revision: sql`${connection.revision} + 1`,
        linkedBy: input.person.id,
        linkedAt: sql`statement_timestamp()`,
        testedAt: null,
        testedBy: null,
      })
      .where(ofCompany(input, id))
      .returning(columns)
    if (updated === undefined) throw new Failure('CONNECTION_NOT_FOUND')
    return viewOf(updated)
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

/** Where the grant stands at the provider after Desligar's try; each but REVOKED is also a named log line. */
async function revoked(deps: Deps, input: OfConnection): Promise<Revocation> {
  const [row] = await deps.database.read(scopeOf(input), (tx) =>
    tx
      .select({ connector: connection.connectorId })
      .from(connection)
      .where(ofCompany(input, input.connectionId)),
  )
  const declared = row === undefined ? undefined : connectorOf(row.connector)
  if (declared === undefined || !isOAuth(declared) || declared.auth.revoke === undefined)
    return 'NONE'
  const where = whereOf(input, declared)
  let open: OpenedConnection
  let app: AppKeys
  try {
    app = appKeysOf(deps.apps, declared)
    open = await opened(deps, input)
  } catch (error) {
    if (error instanceof Failure && NOT_SENDABLE.has(error.code)) {
      deps.log.error(where, 'CONNECTION_REVOKE_NOT_SENT')
      return 'NOT_SENT'
    }
    if (error instanceof Failure && error.code === 'CONNECTION_NOT_FOUND') return 'NONE'
    throw error
  }
  const answered = await revokeWithToken(deps, input, { open, declared, app })
  switch (answered.kind) {
    case 'NO_TOKEN':
      deps.log.error({ ...where, ...statusOf(answered.native) }, 'CONNECTION_REVOKE_NOT_SENT')
      return 'NOT_SENT'
    case 'NONE':
      return 'NONE'
    case 'REVOKED':
      deps.log.info(where, 'CONNECTION_REVOKED')
      return 'REVOKED'
    case 'REFUSED':
      deps.log.error({ ...where, ...statusOf(answered.native) }, 'CONNECTION_REVOKE_REFUSED')
      return 'REFUSED'
    case 'UNREACHABLE':
      deps.log.info(where, 'CONNECTION_REVOKE_UNANSWERED')
      return 'UNREACHABLE'
    default:
      return answered satisfies never
  }
}

/** The failures after which Desligar cannot send the revoke but still removes the connection. */
const NOT_SENDABLE: ReadonlySet<string> = new Set(['SEAL_REFUSED', 'CONNECTOR_NOT_CONFIGURED'])

type Sent =
  | NonNullable<Awaited<ReturnType<Deps['executor']['revoke']>>>
  | { kind: 'NONE' }
  | { kind: 'NO_TOKEN'; native: Native }

/** The revoke sent with the connection's live token; an expired one the provider refuses is asked again, forced, once (as Testar does). */
async function revokeWithToken(
  deps: Deps,
  input: OfConnection,
  a: { open: OpenedConnection; declared: OAuthConnector; app: AppKeys },
): Promise<Sent> {
  const access = accessFor(deps, input)
  const ask = { deadlineMs: deps.callDeadlineMs }
  function send(token: BearerToken) {
    return deps.executor.revoke(a.open, a.declared, token, a.app, deps.callDeadlineMs)
  }
  const login = await access.token(a.open, { force: false, ...ask })
  if (login.kind === 'UNREACHABLE') return { kind: 'UNREACHABLE', native: login.native }
  if (login.kind !== 'TOKEN') return { kind: 'NO_TOKEN', native: login.native }
  const answered = await send(login.token)
  if (answered === null) return { kind: 'NONE' }
  if (answered.kind !== 'REFUSED' || answered.native.status !== 401) return answered
  const again = await access.token(a.open, { force: true, refused: answered.native, ...ask })
  if (again.kind === 'UNREACHABLE') return again
  if (again.kind !== 'TOKEN') return { kind: 'NO_TOKEN', native: again.native }
  return (await send(again.token)) ?? { kind: 'NONE' }
}

function whereOf(input: OfConnection, connector: Connector) {
  return { connectionId: input.connectionId, connector: connector.id }
}

/**
 * Removes a connection and its seal; removing one already gone answers the same (criterion 13).
 * Before, a connector that declares a revoke is asked to take the authorization back with the
 * connection's live token. The provider refusing or being down never stops the removal: the
 * company asked to disconnect. What happened comes back, and is logged by name.
 */
export async function unlink(deps: Deps, input: Viewer & { connectionId: ConnectionId }) {
  await deps.database.command(scopeOf(input), (tx) =>
    admitted(deps, tx, input, 'manageConnections'),
  )
  const revocation = await revoked(deps, input)
  const removed = await deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    return tx
      .delete(connection)
      .where(ofCompany(input, input.connectionId))
      .returning({ id: connection.id })
  })
  return {
    removed: removed.length > 0,
    revocation: removed.length > 0 ? revocation : ('NONE' as const),
  }
}

/** One connection, as every member reads it. */
export function detail(deps: Deps, input: OfConnection): Promise<ConnectionDetail> {
  return deps.database.read(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'readConnections')
    return { connection: await viewIn(tx, input, input.connectionId) }
  })
}
