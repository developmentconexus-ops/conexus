import { randomUUID } from 'node:crypto'
import type { Connector, OperationId } from '@conexus/connectors'
import { CONNECTORS, connectorOf } from '@conexus/connectors'
import type {
  CompanyId,
  Connection,
  ConnectionList,
  ConnectorEntry,
  Person,
  TestCheck,
  TestResult,
} from '@conexus/hub-api'
import { CONNECTION_STATES, ConnectionId, PersonId } from '@conexus/hub-api'
import { and, asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database, ReadTx, Scope } from '../../platform/database.ts'
import { transactionLock, violatedConstraint } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { SealKeys } from '../../platform/seal.ts'
import { Credential, open, seal } from '../../platform/seal.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { personNameColumn } from '../identity/public.ts'
import type { BearerToken, Executor, OpenedConnection } from './executor.ts'
import { connection } from './tables.ts'

export type Deps = {
  database: Database
  identity: IdentityPorts
  sealKeys: SealKeys
  executor: Executor
  testBudgetMs: number
}
export type Viewer = { person: Person; companyId: CompanyId }

const CONNECTOR_KEY = 'connection_connector_key'

// Every column but `sealed`, which the company's role cannot read (U2's grant).
const columns = {
  id: connection.id,
  connector: connection.connectorId,
  connectorVersion: connection.connectorVersion,
  state: connection.state,
  linkedById: connection.linkedBy,
  linkedByName: personNameColumn(connection.linkedBy),
  linkedAt: connection.linkedAt,
  testedAt: connection.testedAt,
}

const Row = z.object({
  id: ConnectionId,
  connector: z.string(),
  connectorVersion: z.string(),
  state: z.enum(CONNECTION_STATES),
  linkedById: PersonId,
  linkedByName: z.string().nullable(),
  linkedAt: z.date(),
  testedAt: z.date().nullable(),
})

function viewOf(found: unknown): Connection {
  const row = Row.parse(found)
  return {
    id: row.id,
    connector: row.connector,
    connectorVersion: row.connectorVersion,
    state: row.state,
    linkedBy: row.linkedByName === null ? null : { id: row.linkedById, name: row.linkedByName },
    linkedAt: row.linkedAt.toISOString(),
    testedAt: row.testedAt?.toISOString() ?? null,
  }
}

function entryOf(connector: Connector): ConnectorEntry {
  return {
    id: connector.id,
    name: connector.name,
    version: connector.version,
    fields: Object.entries(connector.auth.fields).map(([name, field]) => ({ name, ...field })),
  }
}

function scopeOf(viewer: Viewer): Scope {
  return { kind: 'COMPANY', companyId: viewer.companyId, personId: viewer.person.id }
}

function admitted(
  deps: Deps,
  tx: ReadTx,
  viewer: Viewer,
  action: 'readConnections' | 'manageConnections',
) {
  return deps.identity.admitMember({
    tx,
    personId: viewer.person.id,
    companyId: viewer.companyId,
    action,
  })
}

function ofCompany(viewer: Viewer, id: ConnectionId) {
  return and(eq(connection.id, id), eq(connection.companyId, viewer.companyId))
}

/** What a connection's seal is bound to: copied to another row, company or connector, it does not open (S32). */
export function sealContext(row: { id: ConnectionId; companyId: CompanyId; connector: Connector }) {
  return {
    purpose: 'connection',
    rowId: row.id,
    companyId: row.companyId,
    personId: null,
    kind: row.connector.auth.kind,
    provider: row.connector.id,
  } as const
}

const Sealed = z.object({ sealed: z.instanceof(Buffer), key_id: z.string().min(1) })

/** A connection's sealed credential, through the one function that hands it out (U2's grant). */
export async function sealedOf(tx: ReadTx, id: ConnectionId) {
  const result = await tx.execute(sql`select sealed, key_id from connectors.sealed_of(${id})`)
  if (result.rows[0] === undefined) throw new Failure('CONNECTION_NOT_FOUND')
  const found = Sealed.parse(result.rows[0])
  return { keyId: found.key_id, blob: found.sealed }
}

/** Every member reads the catalog and the company's connections; nothing of a credential (S41). */
export function list(deps: Deps, viewer: Viewer): Promise<ConnectionList> {
  return deps.database.read(scopeOf(viewer), async (tx) => {
    const member = await admitted(deps, tx, viewer, 'readConnections')
    const rows = await tx
      .select(columns)
      .from(connection)
      .where(eq(connection.companyId, viewer.companyId))
      .orderBy(asc(connection.connectorId))
    return {
      connectors: CONNECTORS.map(entryOf),
      connections: rows.map(viewOf),
      mayManage: deps.identity.allows(member.role, 'manageConnections'),
    }
  })
}

type Link = Viewer & { connector: string; credential: Record<string, string>; attemptKey: string }

/**
 * Links the company to a connector (criterion 9): the attempt's lock, the admission, the fields by
 * the connector's own schema, then a replay compared with the sealed values (code C37). Nothing is
 * called: linking only seals and keeps.
 */
export function link(deps: Deps, input: Link) {
  return deps.database.command(scopeOf(input), async (tx) => {
    await transactionLock(tx, `conexus.connection:${input.companyId}:${input.attemptKey}`)
    await admitted(deps, tx, input, 'manageConnections')
    const connector = connectorOf(input.connector)
    if (connector === undefined) throw new Failure('CONNECTOR_UNKNOWN')
    const parsed = connector.auth.credential.safeParse(input.credential)
    if (!parsed.success) throw new Failure('CONNECTION_CREDENTIAL_INVALID')
    const [found] = await tx
      .select({ id: connection.id, connector: connection.connectorId })
      .from(connection)
      .where(
        and(eq(connection.companyId, input.companyId), eq(connection.attemptKey, input.attemptKey)),
      )
    if (found !== undefined) {
      const id = ConnectionId.parse(found.id)
      const same =
        found.connector === connector.id &&
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
        connectorVersion: connector.version,
        state: 'NEW',
        sealed: Buffer.from(sealed.blob),
        keyId: sealed.keyId,
        linkedBy: input.person.id,
        linkedAt: sql`statement_timestamp()`,
        attemptKey: input.attemptKey,
      })
    } catch (error) {
      if (violatedConstraint(error) === CONNECTOR_KEY)
        throw new Failure('CONNECTION_EXISTS', { cause: error })
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

type OfConnection = Viewer & { connectionId: ConnectionId }

/**
 * Testar's first step (the failure table): a short command that admits and opens the seal, so no
 * database connection is held while the provider answers (data D22). The row's `linked_at` is kept
 * as the database wrote it, to tell the same row from one linked again meanwhile.
 */
function opened(deps: Deps, input: OfConnection): Promise<OpenedConnection> {
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    const [row] = await tx
      .select({
        connector: connection.connectorId,
        linkedAt: sql<string>`${connection.linkedAt}::text`,
      })
      .from(connection)
      .where(ofCompany(input, input.connectionId))
    if (row === undefined) throw new Failure('CONNECTION_NOT_FOUND')
    const connector = connectorOf(row.connector)
    // A connector the kit no longer has cannot rebuild its seal's context: the seal does not open.
    if (connector === undefined)
      throw new Failure('SEAL_REFUSED', { details: { reason: 'connector gone' } })
    const id = input.connectionId
    const context = sealContext({ id, companyId: input.companyId, connector })
    const credential = open(deps.sealKeys, context, await sealedOf(tx, id))
    return { id, linkedAt: row.linkedAt, connector, credential }
  })
}

type Probed =
  | Readonly<{ result: 'WORKING'; checks: TestCheck[] }>
  | Readonly<{ result: 'AUTH_REFUSED' | 'UNREACHABLE' }>

/**
 * Testar's second step: a new token, then each read operation and door entry once, in order and one
 * at a time (the connector's `oneRequestAtATime`). An expired token is asked again once per call.
 * The calls together stay inside `signal`: once it fires the provider is unreachable.
 * Nothing read leaves this function but each operation's outcome.
 */
async function probed(
  executor: Executor,
  opened: OpenedConnection,
  signal: AbortSignal,
): Promise<Probed> {
  const { connector } = opened
  const first = await executor.login(opened, signal)
  if (first.kind !== 'TOKEN') return { result: first.kind }
  let token: BearerToken = first.token
  const checks: TestCheck[] = []
  const earlier = new Map<OperationId, unknown>()
  const operations = [...connector.operations, ...Object.values(connector.readDoor ?? {})]
  for (const operation of operations) {
    function check(outcome: TestCheck['outcome']) {
      checks.push({ id: operation.id, label: operation.label, outcome })
    }
    const input = operation.probe(earlier)
    if (input === null) {
      check('NOTHING_TO_READ')
      continue
    }
    let answered = await executor.call(opened, token, operation, input, signal)
    if (answered.kind === 'TOKEN_EXPIRED') {
      const again = await executor.login(opened, signal)
      if (again.kind !== 'TOKEN') return { result: again.kind }
      token = again.token
      answered = await executor.call(opened, token, operation, input, signal)
    }
    switch (answered.kind) {
      case 'OK':
        earlier.set(operation.id, answered.value)
        check('READS')
        break
      case 'REFUSED':
      case 'UNREADABLE':
        check(answered.kind)
        break
      case 'AUTH_REFUSED':
      case 'TOKEN_EXPIRED':
        return { result: 'AUTH_REFUSED' }
      case 'UNREACHABLE':
        return { result: 'UNREACHABLE' }
      default:
        return answered satisfies never
    }
  }
  return { result: 'WORKING', checks }
}

const NEXT_STATE = { WORKING: 'ACTIVE', AUTH_REFUSED: 'NEEDS_REAUTH' } as const

/**
 * Testar's last step: the state is written only on the row the first step opened (its id and
 * `linked_at`); one removed meanwhile is not found and nothing changes. An unreachable provider
 * changes nothing.
 */
function recorded(deps: Deps, input: OfConnection, opened: OpenedConnection, probe: Probed) {
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    const same = and(
      ofCompany(input, input.connectionId),
      sql`${connection.linkedAt} = ${opened.linkedAt}::timestamptz`,
    )
    const [row] =
      probe.result === 'UNREACHABLE'
        ? await tx.select(columns).from(connection).where(same)
        : await tx
            .update(connection)
            .set({ state: NEXT_STATE[probe.result], testedAt: sql`statement_timestamp()` })
            .where(same)
            .returning(columns)
    if (row === undefined) throw new Failure('CONNECTION_NOT_FOUND')
    return viewOf(row)
  })
}

/** Testar (criteria 10 to 12): the three steps of the failure table. */
export async function test(deps: Deps, input: OfConnection): Promise<TestResult> {
  const open = await opened(deps, input)
  const probe = await probed(deps.executor, open, AbortSignal.timeout(deps.testBudgetMs))
  const view = await recorded(deps, input, open, probe)
  return probe.result === 'WORKING'
    ? { result: 'WORKING', checks: probe.checks, connection: view }
    : { result: probe.result, connection: view }
}
