import type { CompanyId, PersonId } from '@conexus/hub-api'
import { Company, LIBRARY_ID, Member, Membership, PAGE_SIZE } from '@conexus/hub-api'
import { and, asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database, ReadTx } from '../../platform/database.ts'
import { after, pageKey, pageOf } from '../../platform/pages.ts'
import { admit, mayInviteAs, mayOperate } from './admission.ts'
import { company, member, user } from './tables.ts'

const PersonRole = z.object({ role: z.string().nullable() })
const MemberRow = Member.extend({ id: z.string().regex(LIBRARY_ID) })

export function readMemberships(database: Database, personId: PersonId, page: string | undefined) {
  return database.read({ kind: 'PERSON', personId }, async (tx) => {
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
      mayOperate: mayOperate(person?.role),
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
  return database.read({ kind: 'COMPANY', ...input }, async (tx) => {
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
  return database.read({ kind: 'COMPANY', ...input }, async (tx) => {
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
