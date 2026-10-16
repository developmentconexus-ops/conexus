import type { Next, Person } from '@conexus/hub-api'
import { Company, Member, Membership, PAGE_SIZE } from '@conexus/hub-api'
import type { SQL } from 'drizzle-orm'
import { and, asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { ReadTx } from '../../platform/database.ts'
import { transactionLock } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { Admitted } from './admission.ts'
import { admit, mayCreateCompanies } from './admission.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { refusedAs } from './auth.ts'
import { company, member, user } from './tables.ts'

/** One row more than a page tells whether another page follows; its key is the last row's id. */
export function pageOf<T>(rows: T[], idOf: (row: T) => string): { rows: T[]; next: Next } {
  const shown = rows.slice(0, PAGE_SIZE)
  const last = shown.at(-1)
  if (rows.length <= PAGE_SIZE || last === undefined) return { rows: shown, next: { kind: 'END' } }
  return { rows: shown, next: { kind: 'MORE', page: idOf(last) } }
}

export function after(order: SQL, page: string | undefined, key: SQL): SQL | undefined {
  return page === undefined ? undefined : sql`${order} > (${key})`
}

const PersonRole = z.object({ role: z.string().nullable() })

export async function readMemberships(tx: ReadTx, personId: string, page: string | undefined) {
  const rows = await tx
    .select({ id: company.id, name: company.name, role: member.role })
    .from(member)
    .innerJoin(company, eq(member.organizationId, company.id))
    .where(
      and(
        eq(member.userId, personId),
        after(
          sql`(${company.name}, ${company.id})`,
          page,
          sql`select name, id from auth.company where id = ${page}`,
        ),
      ),
    )
    .orderBy(asc(company.name), asc(company.id))
    .limit(PAGE_SIZE + 1)
  const listed = pageOf(rows, (row) => row.id)
  const [named] = await tx.select({ role: user.role }).from(user).where(eq(user.id, personId))
  const person = PersonRole.optional().parse(named)
  return {
    companies: listed.rows.map((row) =>
      Membership.parse({ company: { id: row.id, name: row.name }, role: row.role }),
    ),
    mayCreate: mayCreateCompanies(person?.role),
    next: listed.next,
  }
}

export async function readCompany(tx: ReadTx, admitted: Admitted): Promise<Company> {
  const [row] = await tx
    .select({ id: company.id, name: company.name })
    .from(company)
    .where(eq(company.id, admitted.companyId))
  return Company.parse(row)
}

export async function readMembers(tx: ReadTx, admitted: Admitted, page: string | undefined) {
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
        after(
          sql`(${user.name}, ${member.id})`,
          page,
          sql`select p.name, m.id from auth.member m join auth.user p on p.id = m.user_id
            where m.id = ${page} and m.company_id = ${admitted.companyId}`,
        ),
      ),
    )
    .orderBy(asc(user.name), asc(member.id))
    .limit(PAGE_SIZE + 1)
  const listed = pageOf(rows, (row) => row.id)
  return { members: listed.rows.map((row) => Member.parse(row)), next: listed.next }
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
        .select({ id: company.id, name: company.name })
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
