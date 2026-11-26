import { randomUUID } from 'node:crypto'
import type { AppKeys, ClientCredentialsAuth, Connector, Native } from '@conexus/connectors'
import { CONNECTORS, connectorOf } from '@conexus/connectors'
import type {
  CompanyId,
  Connection,
  ConnectionDetail,
  ConnectionList,
  Revocation,
} from '@conexus/hub-api'
import { ConnectionId, ConnectionName } from '@conexus/hub-api'
import { and, asc, eq, sql } from 'drizzle-orm'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { transactionLock, violatedConstraint } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { Credential, open, seal } from '../../platform/seal.ts'
import type { OAuthConnector } from './apps.ts'
import { appKeysOf, isOAuth } from './apps.ts'
import { connectorEntryOf } from './catalog-subjects.ts'
import type { OpenedConnection } from './executor.ts'
import { bearerOf } from './executor.ts'
import { notesOf } from './notes.ts'
import type { Deps, OfConnection, Viewer } from './rows.ts'
import {
  admitted,
  columns,
  connectorIn,
  ofCompany,
  scopeOf,
  sealContext,
  sealedOf,
  viewOf,
} from './rows.ts'
import { connection } from './tables.ts'
import { opened } from './testing.ts'
import { sessionFor, statusOf } from './tokens.ts'

const NAME_KEY = 'connection_name_key'

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
      connectors: CONNECTORS.map(connectorEntryOf),
      connections: rows.map(viewOf),
      mayManage: deps.identity.allows(member.role, 'manageConnections'),
    }
  })
}

export type Link = Viewer & {
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

/** The attempt's lock: a second command on the same key waits for the first one's transaction (code C37). */
export function lockAttempt(tx: CommandTx, companyId: CompanyId, attemptKey: string) {
  return transactionLock(tx, `conexus.connection:${companyId}:${attemptKey}`)
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
    await lockAttempt(tx, input.companyId, input.attemptKey)
    return linkIn(deps, tx, input, name.data)
  })
}

/** The rest of `link` inside a transaction that holds the attempt's lock, for the one that also holds a link's (U20). */
export async function linkIn(deps: Deps, tx: CommandTx, input: Link, name: string) {
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
      found.name === name &&
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
      name,
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
}

/**
 * Conectar de novo for pasted fields (criterion 17): new fields sealed to the same row, NEW, a new
 * revision, who linked and when, and no last test. A Testar still running on the old fields
 * compares `linked_at` and writes nothing over it.
 */
export async function reconnect(
  deps: Deps,
  input: OfConnection & { credential: Record<string, string> },
): Promise<Connection> {
  const reconnected = await deps.database.command(scopeOf(input), async (tx) => {
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
  // The old keys' token is logged out after the write, as a warning if it fails (the executor logs it).
  await deps.limits.forget(input.connectionId)
  return reconnected
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
  const declared = row === undefined ? undefined : connectorIn(deps, row.connector)
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

type Revoke = Awaited<ReturnType<Deps['executor']['revoke']>>
type Sent = NonNullable<Revoke> | { kind: 'NONE' } | { kind: 'NO_TOKEN'; native: Native }

async function revokeWithToken(
  deps: Deps,
  input: OfConnection,
  a: { open: OpenedConnection; declared: OAuthConnector; app: AppKeys },
): Promise<Sent> {
  const answered = await sessionFor(deps, input, a.open).call<Revoke>(async (token) => {
    const sent = await deps.executor.revoke(
      a.open,
      a.declared,
      bearerOf(token),
      a.app,
      deps.callDeadlineMs,
    )
    return sent?.kind === 'REFUSED' && sent.native.status === 401
      ? { kind: 'TOKEN_EXPIRED' as const, native: sent.native }
      : sent
  }, AbortSignal.timeout(deps.callDeadlineMs))
  if (answered === null) return { kind: 'NONE' }
  switch (answered.kind) {
    case 'REVOKED':
    case 'REFUSED':
    case 'UNREACHABLE':
      return answered
    case 'TOKEN_EXPIRED':
    case 'NEEDS_REAUTH':
      return { kind: 'REFUSED', native: answered.native }
    case 'AUTH_REFUSED':
    case 'UNREADABLE':
    case 'APP_REFUSED':
      return { kind: 'NO_TOKEN', native: answered.native }
    default:
      return answered satisfies never
  }
}

function whereOf(input: OfConnection, connector: Connector) {
  return { connectionId: input.connectionId, connector: connector.id }
}

/**
 * Removes a connection and its seal; removing one already gone answers the same (criterion 13).
 * The lake copy leaves first (criterion 47; AWS out is a 503), then the provider is asked to take
 * the authorization back, and its refusal never stops the removal, made in one transaction.
 */
export async function unlink(deps: Deps, input: Viewer & { connectionId: ConnectionId }) {
  await deps.database.command(scopeOf(input), (tx) =>
    admitted(deps, tx, input, 'manageConnections'),
  )
  await deps.leaveCopy(input)
  const revocation = await revoked(deps, input)
  const removed = await deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    const rows = await tx
      .delete(connection)
      .where(ofCompany(input, input.connectionId))
      .returning({ id: connection.id })
    return rows.length > 0
  })
  await deps.limits.forget(input.connectionId)
  return { removed, revocation: removed ? revocation : ('NONE' as const) }
}

/** One connection, as every member reads it. */
export function detail(deps: Deps, input: OfConnection): Promise<ConnectionDetail> {
  return deps.database.read(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'readConnections')
    return {
      connection: await viewIn(tx, input, input.connectionId),
      notes: await notesOf(tx, input),
    }
  })
}
