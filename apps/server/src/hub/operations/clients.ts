import type { Client, Cnpj, Email, Person } from '@conexus/hub-api'
import { ClientSummary, CompanyId, PAGE_SIZE } from '@conexus/hub-api'
import { asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx, Database, ReadTx } from '../../platform/database.ts'
import { transactionLock, violatedConstraint } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { after, pageKey, pageOf } from '../../platform/pages.ts'
import type { IdentityPorts, OperatorProof } from '../identity/public.ts'
import type { ProjectPorts } from '../projects/public.ts'
import { client } from './tables.ts'

type Deps = { database: Database; identity: IdentityPorts; projects: ProjectPorts }
type ClientData = { cnpj: Cnpj; legalName: string; name: string }

const CNPJ_KEY = 'client_cnpj_key'
const ClientRow = z.object({
  companyId: CompanyId,
  cnpj: ClientSummary.shape.cnpj,
  legalName: z.string().min(1),
  revision: z.number().int().nonnegative(),
  registeredAt: z.date(),
})

/** A second client with the same CNPJ is refused by the unique index, also between two at once. */
async function refusedIfCnpjTaken<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work()
  } catch (error) {
    if (violatedConstraint(error) === CNPJ_KEY) throw new Failure('CLIENT_EXISTS', { cause: error })
    throw error
  }
}

/** Each record with its company's name and state, which identity owns (code C8). */
async function clientsOf(
  deps: Deps,
  tx: ReadTx,
  admitted: OperatorProof,
  rows: unknown[],
): Promise<Client[]> {
  const parsed = rows.map((row) => ClientRow.parse(row))
  const companyIds = parsed.map((row) => row.companyId)
  const operated = await deps.identity.readOperatedCompanies(tx, { admitted, companyIds })
  return parsed.flatMap((row) => {
    const company = operated.get(row.companyId)
    if (company === undefined) return []
    const { registeredAt, ...kept } = row
    return [{ ...kept, ...company, registeredAt: registeredAt.toISOString() }]
  })
}

async function clientOf(deps: Deps, tx: ReadTx, admitted: OperatorProof, companyId: CompanyId) {
  const rows = await tx.select().from(client).where(eq(client.companyId, companyId))
  const [found] = await clientsOf(deps, tx, admitted, rows)
  if (found === undefined) throw new Failure('NOT_FOUND')
  return found
}

/** The Central's scope, for the person of the session; a company only where a command needs all of its rows. */
function operatorScope(person: Person, companyId: CompanyId | null) {
  return { kind: 'OPERATOR', personId: person.id, companyId } as const
}

type Registration = ClientData & { person: Person; ownerEmail: Email; attemptKey: string }

/**
 * Registers a client: its record, and through identity its company with no member and the first
 * owner's invitation, in one transaction. The key is the attempt's (code C37).
 */
function register(deps: Deps, input: Registration) {
  const { identity } = deps
  return identity.libraryCommand(operatorScope(input.person, null), async (tx) => {
    const { attemptKey: key } = input
    // Two registrations with one key at once: the second waits here and finds the first's.
    await transactionLock(tx, `conexus.client:${key}`)
    const personId = input.person.id
    const admitted = await identity.admitOperator({ tx, personId, action: 'registerClient' })
    const [same] = await tx.select().from(client).where(eq(client.attemptKey, key))
    if (same !== undefined) {
      // The replay is compared with the client as it is now: after a correction, the first body
      // is another request, 409 (code C37).
      if (same.cnpj !== input.cnpj || same.legalName !== input.legalName) {
        throw new Failure('IDEMPOTENCY_CONFLICT')
      }
    }
    const registered = await identity.registerCompany(tx, {
      admitted,
      name: input.name,
      ownerEmail: input.ownerEmail,
      attemptKey: key,
    })
    const companyId = registered.company.id
    if (same === undefined) {
      // The key of a company that is no client's: never one this command made.
      if (!registered.created) throw new Failure('IDEMPOTENCY_CONFLICT')
      await insertClient(tx, { ...input, companyId, key })
    }
    return {
      admitted,
      client: await clientOf(deps, tx, admitted, companyId),
      company: registered.company,
      mail: registered.mail,
      created: same === undefined,
    }
  })
}

async function insertClient(
  tx: CommandTx,
  row: ClientData & { companyId: CompanyId; key: string },
) {
  await refusedIfCnpjTaken(() =>
    tx.insert(client).values({
      companyId: row.companyId,
      cnpj: row.cnpj,
      legalName: row.legalName,
      attemptKey: row.key,
      registeredAt: sql`statement_timestamp()`,
    }),
  )
}

type Correction = ClientData & { person: Person; companyId: CompanyId; revision: number }

/** Corrects a client still awaiting its administrator, at the revision it read (code C38). */
function correct(deps: Deps, input: Correction) {
  const { identity } = deps
  return identity.libraryCommand(operatorScope(input.person, input.companyId), async (tx) => {
    // The company's lock before the operator's row and the client's, the order the owner's
    // invitation and its accept keep: the other order deadlocked them (step 5, criterion 11).
    await identity.lockCompany(tx, input.companyId)
    const personId = input.person.id
    const admitted = await identity.admitOperator({ tx, personId, action: 'correctClient' })
    const [row] = await tx
      .select({ revision: client.revision })
      .from(client)
      .where(eq(client.companyId, input.companyId))
      .for('update')
    if (row === undefined) throw new Failure('NOT_FOUND')
    if (row.revision !== input.revision) throw new Failure('CLIENT_STALE')
    const { companyId, name } = input
    const renamed = await identity.renameCompany(tx, { admitted, companyId, name })
    if (!renamed.ok) throw new Failure('CLIENT_ACTIVE')
    await refusedIfCnpjTaken(() =>
      tx
        .update(client)
        .set({
          cnpj: input.cnpj,
          legalName: input.legalName,
          revision: sql`${client.revision} + 1`,
        })
        .where(eq(client.companyId, companyId)),
    )
    return clientOf(deps, tx, admitted, companyId)
  })
}

type Deletion = { person: Person; companyId: CompanyId; name: string; revision: number }

/**
 * The client at the revision and name the operator confirmed (code C38), its row held until commit.
 * Only the revision and the company's name are read (issue 73): the locks come in a correction's
 * order, and a deleted or unknown client is the same 404.
 */
async function confirmed(deps: Deps, tx: CommandTx, admitted: OperatorProof, input: Deletion) {
  const [row] = await tx
    .select({ revision: client.revision })
    .from(client)
    .where(eq(client.companyId, input.companyId))
    .for('update')
  if (row === undefined) throw new Failure('NOT_FOUND')
  if (row.revision !== input.revision) throw new Failure('CLIENT_STALE')
  const { companyId } = input
  if ((await deps.identity.companyNameOf(tx, { admitted, companyId })) !== input.name) {
    throw new Failure('CLIENT_NAME_MISMATCH')
  }
}

async function removeRows(deps: Deps, tx: CommandTx, admitted: OperatorProof, input: Deletion) {
  await tx.delete(client).where(eq(client.companyId, input.companyId))
  await deps.identity.deleteCompany(tx, { admitted, companyId: input.companyId })
}

/**
 * Deletes a client in phases, because its database is outside this one (data D22). Without a
 * database it is one transaction: the record, then through identity the company, members and
 * invitations; its people stay. With one, the first transaction marks the company, which ends every
 * person's admission and every link; Neon frees the database with no transaction open; the last
 * transaction removes Projects, database row, record and company. A failure after the mark leaves
 * the client `DELETING`, and the same request with the same body resumes it.
 */
async function remove(deps: Deps, input: Deletion): Promise<void> {
  const { identity, projects } = deps
  const { companyId } = input
  const scope = operatorScope(input.person, companyId)
  const personId = input.person.id
  const first = await identity.libraryCommand(scope, async (tx) => {
    await identity.lockCompany(tx, companyId)
    const admitted = await identity.admitOperator({ tx, personId, action: 'deleteClient' })
    await confirmed(deps, tx, admitted, input)
    if (!(await projects.hasCompanyDatabase(tx, { admitted, companyId }))) {
      await removeRows(deps, tx, admitted, input)
      return undefined
    }
    await identity.markCompanyDeleting(tx, { admitted, companyId })
    return admitted
  })
  if (first === undefined) return
  await projects.releaseCompanyDatabase({ admitted: first, companyId })
  await identity.libraryCommand(scope, async (tx) => {
    await identity.lockCompany(tx, companyId)
    const admitted = await identity.admitOperator({ tx, personId, action: 'deleteClient' })
    await confirmed(deps, tx, admitted, input)
    await projects.deleteCompanyProjects(tx, { admitted, companyId })
    await removeRows(deps, tx, admitted, input)
  })
}

/** The clients in the order they were registered, 50 a page (code C44). */
function list(deps: Deps, person: Person, page: string | undefined) {
  return deps.database.read(operatorScope(person, null), async (tx) => {
    const personId = person.id
    const admitted = await deps.identity.admitOperator({ tx, personId, action: 'operateClients' })
    const key = pageKey(page)
    const rows = await tx
      .select()
      .from(client)
      .where(
        after(sql`(${client.registeredAt}, ${client.companyId})`, key, (id) =>
          tx
            .select({ registeredAt: client.registeredAt, companyId: client.companyId })
            .from(client)
            .where(eq(client.companyId, id)),
        ),
      )
      .orderBy(asc(client.registeredAt), asc(client.companyId))
      .limit(PAGE_SIZE + 1)
    const listed = pageOf(rows, (row) => row.companyId)
    const clients = await clientsOf(deps, tx, admitted, listed.rows)
    // The answer's schema keeps a summary's fields only, at the exit (code C27, C31).
    return { clients, next: listed.next }
  })
}

function get(deps: Deps, person: Person, companyId: CompanyId) {
  return deps.database.read(operatorScope(person, null), async (tx) => {
    const personId = person.id
    const admitted = await deps.identity.admitOperator({ tx, personId, action: 'operateClients' })
    return clientOf(deps, tx, admitted, companyId)
  })
}

export function createClients(deps: Deps) {
  return Object.freeze({
    register: (input: Registration) => register(deps, input),
    correct: (input: Correction) => correct(deps, input),
    remove: (input: Deletion) => remove(deps, input),
    list: (person: Person, page: string | undefined) => list(deps, person, page),
    get: (person: Person, companyId: CompanyId) => get(deps, person, companyId),
  })
}

export type Clients = ReturnType<typeof createClients>
