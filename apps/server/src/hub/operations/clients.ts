import type { Cnpj, Email, Person } from '@conexus/hub-api'
import { Client, ClientSummary, CompanyId, PAGE_SIZE } from '@conexus/hub-api'
import { asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx, Database, ReadTx } from '../../platform/database.ts'
import { transactionLock, violatedConstraint } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { after, pageKey, pageOf } from '../../platform/pages.ts'
import type { IdentityPorts, OperatorProof } from '../identity/public.ts'
import { client } from './tables.ts'

type Deps = { database: Database; identity: IdentityPorts }
type ClientData = { cnpj: Cnpj; legalName: string; name: string }

const CNPJ_KEY = 'client_cnpj_key'
const ClientRow = z.object({
  companyId: CompanyId,
  cnpj: z.string(),
  legalName: z.string(),
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
async function clientsOf(deps: Deps, tx: ReadTx, admitted: OperatorProof, rows: unknown[]) {
  const parsed = rows.map((row) => ClientRow.parse(row))
  const companyIds = parsed.map((row) => row.companyId)
  const operated = await deps.identity.readOperatedCompanies(tx, { admitted, companyIds })
  return parsed.flatMap((row) => {
    const company = operated.get(row.companyId)
    if (company === undefined) return []
    const { registeredAt, ...kept } = row
    return [Client.parse({ ...kept, ...company, registeredAt: registeredAt.toISOString() })]
  })
}

async function clientOf(deps: Deps, tx: ReadTx, admitted: OperatorProof, companyId: CompanyId) {
  const rows = await tx.select().from(client).where(eq(client.companyId, companyId))
  const [found] = await clientsOf(deps, tx, admitted, rows)
  if (found === undefined) throw new Failure('NOT_FOUND')
  return found
}

type Registration = ClientData & { person: Person; ownerEmail: Email; attemptKey: string }

/**
 * Registers a client: its record, and through identity its company with no member and the first
 * owner's invitation, in one transaction. The key is the attempt's (code C37).
 */
function register(deps: Deps, input: Registration) {
  const { identity } = deps
  return identity.libraryCommand(async (tx) => {
    const { attemptKey: key } = input
    // Two registrations with one key at once: the second waits here and finds the first's.
    await transactionLock(tx, `conexus.client:${key}`)
    const personId = input.person.id
    const admitted = await identity.admitOperator({ tx, personId, action: 'registerClient' })
    const [same] = await tx.select().from(client).where(eq(client.attemptKey, key))
    if (same !== undefined) {
      if (same.cnpj !== input.cnpj || same.legalName !== input.legalName) {
        throw new Failure('IDEMPOTENCY_CONFLICT')
      }
    } else if (await identity.isOperator(tx, input.ownerEmail)) {
      // Conexus never becomes a member of a client (step 4.2).
      throw new Failure('CLIENT_OWNER_IS_OPERATOR')
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
  return identity.libraryCommand(async (tx) => {
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

/** The clients in the order they were registered, 50 a page (code C44). */
function list(deps: Deps, person: Person, page: string | undefined) {
  return deps.database.read(async (tx) => {
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
    return { clients: clients.map((shown) => ClientSummary.parse(shown)), next: listed.next }
  })
}

function get(deps: Deps, person: Person, companyId: CompanyId) {
  return deps.database.read(async (tx) => {
    const personId = person.id
    const admitted = await deps.identity.admitOperator({ tx, personId, action: 'operateClients' })
    return clientOf(deps, tx, admitted, companyId)
  })
}

export function createClients(deps: Deps) {
  return Object.freeze({
    register: (input: Registration) => register(deps, input),
    correct: (input: Correction) => correct(deps, input),
    list: (person: Person, page: string | undefined) => list(deps, person, page),
    get: (person: Person, companyId: CompanyId) => get(deps, person, companyId),
  })
}

export type Clients = ReturnType<typeof createClients>
