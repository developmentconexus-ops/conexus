import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { ClientCredentialsAuth, Connector } from '@conexus/connectors'
import { connectorOf } from '@conexus/connectors'
import type { ConnectionId, ConnectionLink } from '@conexus/hub-api'
import {
  CONNECTION_LINK_MINUTES,
  CompanyId,
  ConnectionLinkId,
  ConnectionLinkPage,
  ConnectionName,
  PersonId,
} from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { Credential, open, seal } from '../../platform/seal.ts'
import { personNameColumn } from '../identity/public.ts'
import { linkIn, lockAttempt } from './connections.ts'
import type { Deps, Viewer } from './rows.ts'
import { admitted, scopeOf } from './rows.ts'
import { connection, connectionLink } from './tables.ts'
import { test } from './testing.ts'

const SECRET_BYTES = 32

/** The secret lives only in the address; the Hub keeps and finds the link by this digest (S41). */
function digestOf(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}

const Fields = z.record(z.string(), z.string())

/** What a link's sealed values are bound to: that row, company, person and connector (S32). */
function linkContext(link: Found, connector: Connector) {
  return {
    purpose: 'connection-link',
    rowId: link.id,
    companyId: link.companyId,
    personId: link.createdBy,
    kind: connector.auth.kind,
    provider: connector.id,
  } as const
}

/** The connector and its pasted-fields login, or the one that has none: a link is for fields alone. */
function fieldsLoginOf(id: string) {
  const connector = connectorOf(id)
  if (connector === undefined) throw new Failure('CONNECTOR_UNKNOWN')
  if (connector.auth.kind !== 'client_credentials') throw new Failure('LINK_NOT_FOR_SIGN_IN')
  return { connector, auth: connector.auth }
}

/** The values the asker already filled, by the connector's own field list (C27); the rest must be asked. */
function filledOf(auth: ClientCredentialsAuth, input: { asked: string[]; filled: Fields }) {
  const names = Object.keys(auth.fields)
  const filled = Object.entries(input.filled).map(([name, value]) => [name, value.trim()] as const)
  const asked = new Set(input.asked)
  const given = new Set(filled.map(([name]) => name))
  const complete = names.every((name) => asked.has(name) !== given.has(name))
  const known = [...asked, ...given].every((name) => names.includes(name))
  const fits = filled.every(([name, value]) => {
    const limit = auth.fields[name]?.maxLength ?? 0
    return value.length >= 1 && value.length <= limit
  })
  if (asked.size !== input.asked.length || !complete || !known || !fits) {
    throw new Failure('CONNECTION_CREDENTIAL_INVALID')
  }
  return Object.fromEntries(filled)
}

type Fields = z.infer<typeof Fields>

/**
 * Makes a link (criterion 97): the admission first, so a Membro learns nothing, then the fields the
 * other person fills and the ones already filled, sealed to the row. The address leaves once; the row
 * keeps only the digest of its secret.
 */
export async function createLink(
  deps: Deps,
  input: Viewer & { connector: string; name: string; asked: string[]; filled: Fields },
): Promise<ConnectionLink> {
  const name = ConnectionName.safeParse(input.name)
  const created = await deps.database.command(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input, 'manageConnections')
    if (!name.success) throw new Failure('CONNECTION_NAME_INVALID')
    const { connector, auth } = fieldsLoginOf(input.connector)
    const filled = filledOf(auth, input)
    const link = {
      id: ConnectionLinkId.parse(randomUUID()),
      companyId: input.companyId,
      createdBy: PersonId.parse(input.person.id),
    }
    const secret = randomBytes(SECRET_BYTES).toString('base64url')
    const sealed =
      Object.keys(filled).length === 0
        ? undefined
        : seal(
            deps.sealKeys,
            linkContext(link, connector),
            Credential.parse(JSON.stringify(filled)),
          )
    const [row] = await tx
      .insert(connectionLink)
      .values({
        ...{ id: link.id, companyId: link.companyId, connectorId: connector.id },
        ...{ name: name.data, secretHash: digestOf(secret), asked: input.asked },
        ...{ sealed: sealed && Buffer.from(sealed.blob), keyId: sealed?.keyId ?? null },
        createdBy: link.createdBy,
        expiresAt: sql`statement_timestamp() + make_interval(mins => ${CONNECTION_LINK_MINUTES})`,
      })
      .returning({ expiresAt: connectionLink.expiresAt })
    if (row === undefined) throw new Error('The link was not kept')
    return { link, connector: connector.id, secret, expiresAt: row.expiresAt }
  })
  deps.log.info(
    { linkId: created.link.id, companyId: input.companyId, by: input.person.id },
    'CONNECTION_LINK_CREATED',
  )
  const url = `${deps.publicOrigin}/connection-links/${created.secret}`
  return { url, expiresAt: created.expiresAt.toISOString() }
}

type Found = { id: ConnectionLinkId; companyId: CompanyId; createdBy: PersonId }
const FoundRow = z.object({ id: ConnectionLinkId, company_id: CompanyId, created_by: PersonId })

/** A 404 that says nothing of why; the reason and the link's id, never the secret, go to the registro (S10, S41). */
function refused(deps: Deps, reason: string, link?: Found): Failure {
  const fields = link === undefined ? { reason } : { reason, linkId: link.id }
  deps.log.info(fields, 'CONNECTION_LINK_REFUSED')
  return new Failure('NOT_FOUND', { details: { reason } })
}

/** The live link of a secret, found by its digest through the one function that reads every company's links. */
async function findLink(deps: Deps, secret: string): Promise<Found> {
  const rows = await deps.database.installationRead((tx) =>
    tx.execute(sql`select id, company_id, created_by from connectors.link_of(${digestOf(secret)})`),
  )
  const [row] = rows.rows.map((each) => FoundRow.parse(each))
  if (row === undefined) throw refused(deps, 'NOT_LIVE')
  return { id: row.id, companyId: row.company_id, createdBy: row.created_by }
}

/** Who asked still may: one who lost `manageConnections` makes the link answer as one that is gone. */
async function askerAdmitted(deps: Deps, tx: CommandTx, link: Found): Promise<void> {
  try {
    await admitted(
      deps,
      tx,
      { person: { id: link.createdBy }, companyId: link.companyId },
      'manageConnections',
    )
  } catch (error) {
    if (error instanceof Failure && error.code === 'NOT_FOUND')
      throw refused(deps, 'ASKER_LOST', link)
    throw error
  }
}

function askerOf(link: Found): Viewer {
  return { person: { id: link.createdBy }, companyId: link.companyId }
}

/** The link's connector as a fields login; one the kit no longer has, or no longer by fields, makes the link gone. */
function loginOfLink(deps: Deps, link: Found, id: string) {
  const connector = connectorOf(id)
  if (connector?.auth.kind !== 'client_credentials') throw refused(deps, 'GONE', link)
  return { connector, auth: connector.auth }
}

/** The page of a link (criterion 98): who asked, the system, and the asked fields alone. */
export async function readLink(deps: Deps, secret: string): Promise<ConnectionLinkPage> {
  const link = await findLink(deps, secret)
  return deps.database.command(scopeOf(askerOf(link)), async (tx) => {
    await askerAdmitted(deps, tx, link)
    const [row] = await tx
      .select({
        connector: connectionLink.connectorId,
        asked: connectionLink.asked,
        askedBy: personNameColumn(connectionLink.createdBy),
      })
      .from(connectionLink)
      .where(and(eq(connectionLink.id, link.id), eq(connectionLink.companyId, link.companyId)))
    if (row === undefined || row.askedBy === null) throw refused(deps, 'GONE', link)
    const { connector, auth } = loginOfLink(deps, link, row.connector)
    const fields = row.asked.map((name) => ({ name, ...auth.fields[name] }))
    return {
      askedBy: row.askedBy,
      system: { name: connector.name, logo: connector.logo },
      fields: z.array(ConnectionLinkPage.shape.fields.element).parse(fields),
    }
  })
}

type Born = { connectionId: ConnectionId }

/**
 * The connection of a send, born in the link's own lock (criterion 99): a second send finds the
 * connection already there, ending or ended, and answers as a spent link. The asked fields join the
 * ones sealed with the link, and the connection is linked in the name of who asked.
 */
async function born(deps: Deps, link: Found, sent: Fields): Promise<Born> {
  return deps.database.command(scopeOf(askerOf(link)), async (tx) => {
    await lockAttempt(tx, link.companyId, link.id)
    const [row] = await tx
      .select({
        connector: connectionLink.connectorId,
        name: connectionLink.name,
        asked: connectionLink.asked,
        sealed: connectionLink.sealed,
        keyId: connectionLink.keyId,
      })
      .from(connectionLink)
      .where(
        and(
          eq(connectionLink.id, link.id),
          eq(connectionLink.companyId, link.companyId),
          sql`${connectionLink.expiresAt} > statement_timestamp()`,
        ),
      )
    if (row === undefined) throw refused(deps, 'NOT_LIVE', link)
    const [taken] = await tx
      .select({ id: connection.id })
      .from(connection)
      .where(and(eq(connection.companyId, link.companyId), eq(connection.attemptKey, link.id)))
    if (taken !== undefined) throw refused(deps, 'SPENT', link)
    await askerAdmitted(deps, tx, link)
    const { connector } = loginOfLink(deps, link, row.connector)
    const given = Object.keys(sent).sort().join()
    if (given !== [...row.asked].sort().join()) throw new Failure('CONNECTION_CREDENTIAL_INVALID')
    const filled =
      row.sealed === null || row.keyId === null
        ? {}
        : Fields.parse(
            JSON.parse(
              open(deps.sealKeys, linkContext(link, connector), {
                keyId: row.keyId,
                blob: row.sealed,
              }).reveal(),
            ),
          )
    const input = {
      ...askerOf(link),
      ...{ connector: row.connector, name: row.name, attemptKey: link.id },
      credential: { ...filled, ...sent },
    }
    const made = await linkIn(deps, tx, input, ConnectionName.parse(row.name))
    return { connectionId: made.connection.id }
  })
}

/** Takes a connection out that the link made and did not keep, with the token it opened. */
async function undone(deps: Deps, link: Found, connectionId: ConnectionId): Promise<void> {
  await deps.database.command(scopeOf(askerOf(link)), (tx) =>
    tx
      .delete(connection)
      .where(and(eq(connection.id, connectionId), eq(connection.companyId, link.companyId))),
  )
  await deps.limits.forget(connectionId)
}

/** The link is spent when the connection is kept: `DELETE … RETURNING`, so one send alone takes it. */
async function spent(deps: Deps, link: Found): Promise<void> {
  await deps.database.command(scopeOf(askerOf(link)), (tx) =>
    tx
      .delete(connectionLink)
      .where(and(eq(connectionLink.id, link.id), eq(connectionLink.companyId, link.companyId)))
      .returning({ id: connectionLink.id }),
  )
}

/**
 * The send of a link (criterion 99): the connection is made and tested once, in the name of who
 * asked. A test that throws takes the connection out and says so; a system that refuses the keys
 * takes it out too and leaves the link valid to its deadline; only a working one spends the link.
 */
export async function answerLink(deps: Deps, input: { secret: string; fields: Fields }) {
  const link = await findLink(deps, input.secret)
  const { connectionId } = await born(deps, link, input.fields)
  const where = { linkId: link.id, companyId: link.companyId, connectionId }
  let tested: Awaited<ReturnType<typeof test>>
  try {
    tested = await test(deps, { ...askerOf(link), connectionId })
  } catch (error) {
    await undone(deps, link, connectionId)
    deps.log.info(where, 'CONNECTION_LINK_UNDONE')
    throw error
  }
  if (tested.result === 'WORKING') await spent(deps, link)
  else await undone(deps, link, connectionId)
  deps.log.info({ ...where, result: tested.result }, 'CONNECTION_LINK_ANSWERED')
  return tested
}
