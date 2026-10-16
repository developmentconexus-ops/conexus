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

const ROW_ID = /^[A-Za-z0-9]{32}$/

/**
 * One row more than a page tells whether another page follows. Its token encodes the last row's
 * id, so the client holds no row's identity (code C44).
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

/** The id of the row a page token starts after; a token the Hub did not write is malformed. */
export function pageKey(page: string | undefined): string | undefined {
  if (page === undefined) return undefined
  const id = Buffer.from(page, 'base64url').toString('utf8')
  if (!ROW_ID.test(id) || Buffer.from(id).toString('base64url') !== page) {
    throw new Failure('REQUEST_MALFORMED', { details: { reason: 'PAGE' } })
  }
  return id
}

/** Rows ordered after the one `id` names, whose order key `row` selects; every row on no id. */
export function after(order: SQL, id: string | undefined, row: SQL): SQL | undefined {
  return id === undefined ? undefined : sql`${order} > (${row})`
}

const PersonRole = z.object({ role: z.string().nullable() })

export async function readMemberships(tx: ReadTx, personId: string, page: string | undefined) {
  const key = pageKey(page)
  const rows = await tx
    .select({ id: company.id, name: company.name, role: member.role })
    .from(member)
    .innerJoin(company, eq(member.organizationId, company.id))
    .where(
      and(
        eq(member.userId, personId),
        after(
          sql`(${company.name}, ${company.id})`,
          key,
          sql`select c.name, c.id from auth.company c join auth.member m on m.company_id = c.id
            where c.id = ${key} and m.user_id = ${personId}`,
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
        after(
          sql`(${user.name}, ${member.id})`,
          key,
          sql`select p.name, m.id from auth.member m join auth.user p on p.id = m.user_id
            where m.id = ${key} and m.company_id = ${admitted.companyId}`,
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
