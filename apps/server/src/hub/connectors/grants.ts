import type { Connector, Operation } from '@conexus/connectors'
import { CONNECTORS, connectorOf } from '@conexus/connectors'
import type {
  ConnectionId,
  Grant,
  OfProject,
  ProjectAccess,
  ProjectConnections,
} from '@conexus/hub-api'
import { and, asc, eq, sql } from 'drizzle-orm'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { violatedConstraint, violatedReference } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { personNameColumn } from '../identity/public.ts'
import { liveProjectOf } from '../projects/public.ts'
import type { Deps, Viewer } from './rows.ts'
import { admitted, columns, scopeOf, usable, viewOf } from './rows.ts'
import { connection, projectConnection } from './tables.ts'

type OfGrant = Viewer & OfProject & { connectionId: ConnectionId }

async function liveProject(tx: ReadTx, ids: OfProject) {
  if ((await liveProjectOf(tx, ids)) === undefined)
    throw new Failure('NOT_FOUND', { details: { reason: 'NO_PROJECT' } })
}

/** The kit's read by its id, from the connector's operations or its read door; a write or an unknown id is none. */
export function readOf(
  connector: Connector,
  id: string,
): Operation<unknown, unknown, 'read'> | undefined {
  const found =
    connector.operations.find((operation) => operation.id === id) ?? connector.readDoor?.[id]
  return found !== undefined && isRead(found) ? found : undefined
}

function isRead(
  operation: Operation<unknown, unknown>,
): operation is Operation<unknown, unknown, 'read'> {
  return operation.class === 'read'
}

const GRANT_COLUMNS = {
  grantedByName: personNameColumn(projectConnection.grantedBy),
  grantedAt: projectConnection.grantedAt,
}

function grantOf(row: { grantedByName: string | null; grantedAt: Date }): Grant {
  return { by: row.grantedByName, at: row.grantedAt.toISOString() }
}

/** What the Projeto can do with the connection now: the grant is kept, and reads only while `usable`. */
function accessOf(row: {
  grantedByName: string | null
  grantedAt: Date | null
  usable: boolean
}): ProjectAccess {
  if (row.grantedAt === null) {
    return { kind: row.usable ? 'NOT_RELEASED' : 'NOT_RELEASED_NOT_WORKING' }
  }
  const grant = grantOf({ grantedByName: row.grantedByName, grantedAt: row.grantedAt })
  return { kind: row.usable ? 'READS' : 'RELEASED_NOT_WORKING', grant }
}

/** The company's connections by connector, each with what the Projeto can do with it: every member reads it. */
export function list(deps: Deps, input: Viewer & OfProject): Promise<ProjectConnections> {
  return deps.database.read(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'readConnections')
    await liveProject(tx, input)
    const rows = await tx
      .select({ ...columns, ...GRANT_COLUMNS, usable: sql<boolean>`${usable}` })
      .from(connection)
      .leftJoin(
        projectConnection,
        and(
          eq(projectConnection.connectionId, connection.id),
          eq(projectConnection.projectId, input.projectId),
        ),
      )
      .where(eq(connection.companyId, input.companyId))
      .orderBy(asc(connection.connectorId), asc(connection.linkedAt))
    return {
      connectors: CONNECTORS.flatMap((connector) => {
        const own = rows.filter((row) => row.connector === connector.id)
        if (own.length === 0) return []
        const { id, name, logo, category, perProject, auth } = connector
        return [
          {
            connector: { id, name, logo, category, auth: auth.kind },
            perProject,
            connections: own.map((row) => {
              const view = viewOf(row)
              return {
                id: view.id,
                name: view.name,
                state: view.state,
                account: view.account,
                access: accessOf(row),
              }
            }),
          },
        ]
      }),
    }
  })
}

/** The grant's row, or none when the pair already has one; a second Projeto key, a connection or Projeto gone meanwhile are the database's refusals (23505, 23503). */
async function inserted(
  tx: CommandTx,
  input: OfGrant,
  connector: Connector,
): Promise<Grant | undefined> {
  try {
    const [made] = await tx
      .insert(projectConnection)
      .values({
        projectId: input.projectId,
        companyId: input.companyId,
        connectorId: connector.id,
        connectionId: input.connectionId,
        exclusive: connector.perProject === 'one',
        grantedBy: input.person.id,
        grantedAt: sql`statement_timestamp()`,
      })
      .onConflictDoNothing({
        target: [projectConnection.projectId, projectConnection.connectionId],
      })
      .returning({ ...GRANT_COLUMNS })
    return made === undefined ? undefined : grantOf(made)
  } catch (error) {
    throw refusedGrant(error)
  }
}

function refusedGrant(error: unknown): unknown {
  if (violatedConstraint(error) === 'project_connection_one_key')
    return new Failure('PROJECT_CONNECTION_TAKEN', { cause: error })
  const reference = violatedReference(error)
  if (reference === 'project_connection_connection_fkey')
    return new Failure('CONNECTION_NOT_FOUND', { cause: error })
  if (reference === 'project_connection_project_fkey')
    return new Failure('NOT_FOUND', { cause: error })
  return error
}

async function existingGrant(tx: CommandTx, input: OfGrant): Promise<Grant> {
  const [existing] = await tx
    .select(GRANT_COLUMNS)
    .from(projectConnection)
    .where(
      and(
        eq(projectConnection.projectId, input.projectId),
        eq(projectConnection.connectionId, input.connectionId),
      ),
    )
  if (existing === undefined) throw new Failure('CONNECTION_NOT_FOUND')
  return grantOf(existing)
}

/**
 * Lets the Projeto read the connection, whole (founder, T-A: no ceiling). One row per pair: the
 * second call finds it and answers the same grant. A connection that does not work (not tested yet,
 * or asking to be connected again) is refused first (CONNECTION_NOT_WORKING), even when released
 * before: the app's door would refuse it. A connector that allows one per Projeto has the database
 * refuse a second.
 */
export function grant(deps: Deps, input: OfGrant): Promise<Grant> {
  return deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    await liveProject(tx, input)
    const [found] = await tx
      .select({ connector: connection.connectorId, usable: sql<boolean>`${usable}` })
      .from(connection)
      .where(and(eq(connection.id, input.connectionId), eq(connection.companyId, input.companyId)))
    if (found === undefined) throw new Failure('CONNECTION_NOT_FOUND')
    const connector = connectorOf(found.connector)
    if (connector === undefined) throw new Failure('CONNECTOR_UNKNOWN')
    if (!found.usable) throw new Failure('CONNECTION_NOT_WORKING')
    return (await inserted(tx, input, connector)) ?? (await existingGrant(tx, input))
  })
}

/** Takes the grant; taking one already gone answers the same. A call already admitted finishes, the next is NOT_GRANTED. */
export async function revoke(deps: Deps, input: OfGrant): Promise<boolean> {
  const taken = await deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    return tx
      .delete(projectConnection)
      .where(
        and(
          eq(projectConnection.companyId, input.companyId),
          eq(projectConnection.projectId, input.projectId),
          eq(projectConnection.connectionId, input.connectionId),
        ),
      )
      .returning({ id: projectConnection.connectionId })
  })
  return taken.length > 0
}

/**
 * What the declared connectors and operations lack at the Projeto, for Publicar: a connector with
 * no granted connection that is usable, or an operation that is not a read of the kit's. Read in
 * the publish's own transaction, so a refusal writes nothing.
 */
export async function ungranted(
  tx: ReadTx,
  ids: OfProject,
  declared: readonly { connector: string; operations: readonly string[] }[],
): Promise<readonly { connector: string; operation: string | null }[]> {
  const granted = await tx
    .select({ connector: projectConnection.connectorId })
    .from(projectConnection)
    .innerJoin(connection, eq(connection.id, projectConnection.connectionId))
    .where(and(eq(projectConnection.projectId, ids.projectId), usable))
  const lacking: { connector: string; operation: string | null }[] = []
  for (const one of declared) {
    const connector = connectorOf(one.connector)
    if (connector === undefined || !granted.some((row) => row.connector === connector.id)) {
      lacking.push({ connector: one.connector, operation: null })
      continue
    }
    for (const name of one.operations)
      if (readOf(connector, name) === undefined)
        lacking.push({ connector: one.connector, operation: name })
  }
  return lacking
}
