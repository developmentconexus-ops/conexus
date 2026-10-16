import type { CompanyId, Next, Person, PersonId } from '@conexus/hub-api'
import { Company, LIBRARY_ID, Member, Membership, PAGE_SIZE } from '@conexus/hub-api'
import type { SQL, SQLWrapper } from 'drizzle-orm'
import { and, asc, eq, gt, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database, ReadTx } from '../../platform/database.ts'
import { transactionLock } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { admit, mayCreateCompanies, mayInviteAs } from './admission.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { refusedAs } from './auth.ts'
import { company, member, user } from './tables.ts'

/**
 * One row more than a page tells whether another page follows. Its token is the last row's id in
 * base64url, which the client sends back and never reads (code C44).
 */
export function pageOf<T>(rows: T[], idOf: (row: T) => string): { rows: T[]; next: Next } {
  const shown = rows.slice(0, PAGE_SIZE)
  const last = shown.at(-1)
  if (rows.length <= PAGE_SIZE || last === undefined) return { rows: shown, next: { kind: 'END' } }
  return {
    rows: shown,
    next: { kind: 'MORE', page: Buffer.from(idOf(last)).toString('base64url') },
  }
}

/** The id of the row a page token starts after; a token not in `pageOf`'s form is malformed. */
export function pageKey(page: string | undefined): string | undefined {
  if (page === undefined) return undefined
  const id = Buffer.from(page, 'base64url').toString('utf8')
  if (!LIBRARY_ID.test(id) || Buffer.from(id).toString('base64url') !== page) {
    throw new Failure('REQUEST_MALFORMED', { details: { reason: 'PAGE' } })
  }
  return id
}

/**
 * Rows ordered after the one `id` names, whose order key `anchor` selects; every row on no id. The
 * caller's `(a, b)` is SQL because the builder has no row value (boundaries).
 */
export function after(
  order: SQL,
  id: string | undefined,
  anchor: (id: string) => SQLWrapper,
): SQL | undefined {
  return id === undefined ? undefined : gt(order, anchor(id))
}

const PersonRole = z.object({ role: z.string().nullable() })
const MemberRow = Member.extend({ id: z.string().regex(LIBRARY_ID) })

export function readMemberships(database: Database, personId: string, page: string | undefined) {
  return database.read(async (tx) => {
    const key = pageKey(page)
    const rows = await tx
      .select({ id: company.id, name: company.name, role: member.role })
      .from(member)
      .innerJoin(company, eq(member.organizationId, company.id))
      .where(
        and(
          eq(member.userId, personId),
          after(sql`(${company.name}, ${company.id})`, key, (id) =>
            tx
              .select({ name: company.name, id: company.id })
              .from(company)
              .innerJoin(member, eq(member.organizationId, company.id))
              .where(and(eq(company.id, id), eq(member.userId, personId))),
          ),
        ),
      )
      .orderBy(asc(company.name), asc(company.id))
      .limit(PAGE_SIZE + 1)
    const memberships = rows.map((row) =>
      Membership.parse({ company: { id: row.id, name: row.name }, role: row.role }),
    )
    const listed = pageOf(memberships, (row) => row.company.id)
    const [named] = await tx.select({ role: user.role }).from(user).where(eq(user.id, personId))
    const person = PersonRole.optional().parse(named)
    return {
      companies: listed.rows,
      mayCreate: mayCreateCompanies(person?.role),
      next: listed.next,
    }
  })
}

const named = { id: company.id, name: company.name }

export async function companyById(tx: ReadTx, companyId: string): Promise<Company> {
  const [row] = await tx.select(named).from(company).where(eq(company.id, companyId))
  return Company.parse(row)
}

/** The company, the caller's role in it and the roles the caller may invite with, one snapshot. */
export function readCompany(
  database: Database,
  input: { personId: PersonId; companyId: CompanyId },
) {
  return database.read(async (tx) => {
    const admitted = await admit({ tx, ...input, action: 'readCompany' })
    return {
      company: await companyById(tx, admitted.companyId),
      role: admitted.role,
      mayInviteAs: mayInviteAs(admitted),
    }
  })
}

export function readMembers(
  database: Database,
  input: { personId: PersonId; companyId: CompanyId },
  page: string | undefined,
) {
  return database.read(async (tx) => {
    const admitted = await admit({ tx, ...input, action: 'readCompany' })
    const key = pageKey(page)
    const rows = await tx
      .select({
        id: member.id,
        personId: user.id,
        name: user.name,
        email: user.email,
        role: member.role,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(
        and(
          eq(member.organizationId, admitted.companyId),
          after(sql`(${user.name}, ${member.id})`, key, (id) =>
            tx
              .select({ name: user.name, id: member.id })
              .from(member)
              .innerJoin(user, eq(user.id, member.userId))
              .where(and(eq(member.id, id), eq(member.organizationId, admitted.companyId))),
          ),
        ),
      )
      .orderBy(asc(user.name), asc(member.id))
      .limit(PAGE_SIZE + 1)
    const parsed = rows.map((row) => MemberRow.parse(row))
    const listed = pageOf(parsed, (row) => row.id)
    return { members: listed.rows.map(({ id: _id, ...shown }) => shown), next: listed.next }
  })
}

/**
 * The installation administrator creates a company and becomes its owner. The key is the attempt's
 * (code C37): the same key and name answer the company it made, another name is a conflict.
 */
export function createCompanyCommand(deps: { auth: Auth; libraryCommand: LibraryCommand }) {
  return (input: { person: Person; headers: Headers; name: string; attemptKey: string }) =>
    deps.libraryCommand(async (tx) => {
      // Two creates with one key at once: the second waits here and finds the first's company.
      await transactionLock(tx, `conexus.company:${input.attemptKey}`)
      const [listed] = await tx
        .select(named)
        .from(company)
        .where(eq(company.attemptKey, input.attemptKey))
      const found = Company.optional().parse(listed)
      if (found !== undefined) {
        await admit({ tx, personId: input.person.id, companyId: found.id, action: 'readCompany' })
        if (found.name !== input.name) throw new Failure('IDEMPOTENCY_CONFLICT')
        return { company: found, created: false }
      }
      const body = { name: input.name, slug: input.attemptKey, attemptKey: input.attemptKey }
      const created = await refusedAs(
        () => deps.auth.api.createOrganization({ headers: input.headers, body }),
        {
          YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION: 'NOT_FOUND',
          ORGANIZATION_ALREADY_EXISTS: 'INTERNAL_UNEXPECTED',
        },
      )
      return { company: Company.parse({ id: created.id, name: created.name }), created: true }
    })
}
