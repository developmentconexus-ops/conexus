import type { Connector } from '@conexus/connectors'
import type { CompanyId, Connection, Person } from '@conexus/hub-api'
import { CONNECTION_STATES, ConnectionId, PersonId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database, ReadTx, Scope } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { SealKeys } from '../../platform/seal.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { personNameColumn } from '../identity/public.ts'
import type { Executor } from './executor.ts'
import { connection } from './tables.ts'

export type Deps = {
  database: Database
  identity: IdentityPorts
  sealKeys: SealKeys
  executor: Executor
  log: FailureLog
  callDeadlineMs: number
  testDeadlineMs: number
}
export type Viewer = { person: Person; companyId: CompanyId }
export type OfConnection = Viewer & { connectionId: ConnectionId }

// Every column but `sealed`, which the company's role cannot read (U2's grant).
export const columns = {
  id: connection.id,
  connector: connection.connectorId,
  name: connection.name,
  connectorVersion: connection.connectorVersion,
  state: connection.state,
  linkedById: connection.linkedBy,
  linkedByName: personNameColumn(connection.linkedBy),
  linkedAt: connection.linkedAt,
  testedAt: connection.testedAt,
  testedById: connection.testedBy,
  testedByName: personNameColumn(connection.testedBy),
}

const Row = z.object({
  id: ConnectionId,
  connector: z.string(),
  name: z.string(),
  connectorVersion: z.string(),
  state: z.enum(CONNECTION_STATES),
  linkedById: PersonId,
  linkedByName: z.string().nullable(),
  linkedAt: z.date(),
  testedAt: z.date().nullable(),
  testedById: PersonId.nullable(),
  testedByName: z.string().nullable(),
})

export function viewOf(found: unknown): Connection {
  const row = Row.parse(found)
  return {
    id: row.id,
    connector: row.connector,
    name: row.name,
    connectorVersion: row.connectorVersion,
    state: row.state,
    linkedBy: row.linkedByName === null ? null : { id: row.linkedById, name: row.linkedByName },
    linkedAt: row.linkedAt.toISOString(),
    testedAt: row.testedAt?.toISOString() ?? null,
    testedBy:
      row.testedById === null || row.testedByName === null
        ? null
        : { id: row.testedById, name: row.testedByName },
  }
}

export function scopeOf(viewer: Viewer): Scope {
  return { kind: 'COMPANY', companyId: viewer.companyId, personId: viewer.person.id }
}

export function admitted(
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

export function ofCompany(viewer: Viewer, id: ConnectionId) {
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
