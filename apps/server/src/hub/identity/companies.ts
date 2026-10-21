import type { PersonId } from '@conexus/hub-api'
import { Company, CompanyDetail, CompanyId, Membership, PAGE_SIZE } from '@conexus/hub-api'
import { and, asc, eq, isNotNull, isNull, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { AppsDomain } from '../../platform/config.ts'
import type { Database, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { after, pageKey, pageOf } from '../../platform/pages.ts'
import { admit, mayInviteAs, mayOperate } from './admission.ts'
import { company, member, user } from './tables.ts'

const PersonRole = z.object({ role: z.string().nullable() })

/**
 * A company the person can open: any once it has its nickname, and before that only its owner's,
 * who chooses it (security S10). The others do not see it, as an unknown company.
 */
const opens = or(eq(member.role, 'owner'), isNotNull(company.nickname))

export function readMemberships(database: Database, personId: PersonId, page: string | undefined) {
  return database.read({ kind: 'PERSON', personId }, async (tx) => {
    const key = pageKey(page, CompanyId)
    const rows = await tx
      .select({ id: company.id, name: company.name, role: member.role })
      .from(member)
      .innerJoin(company, eq(member.organizationId, company.id))
      .where(
        and(
          eq(member.userId, personId),
          isNull(company.deletingSince),
          opens,
          after(sql`(${company.name}, ${company.id})`, key, (id) =>
            tx
              .select({ name: company.name, id: company.id })
              .from(company)
              .innerJoin(member, eq(member.organizationId, company.id))
              .where(and(eq(company.id, id), eq(member.userId, personId), opens)),
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

export async function companyById(tx: ReadTx, companyId: CompanyId): Promise<Company> {
  const [row] = await tx.select(named).from(company).where(eq(company.id, companyId))
  return Company.parse(row)
}

/** The company as its own pages read it, with the domain its apps' addresses end in. */
export async function companyDetailOf(
  tx: ReadTx,
  input: { companyId: CompanyId; appsDomain: AppsDomain },
): Promise<CompanyDetail> {
  const [row] = await tx
    .select({ id: company.id, name: company.name, nickname: company.nickname })
    .from(company)
    .where(eq(company.id, input.companyId))
  return CompanyDetail.parse({ ...row, appsDomain: input.appsDomain })
}

/** The company, the caller's role in it and the roles the caller may invite with, one snapshot. */
export function readCompany(
  database: Database,
  input: { personId: PersonId; companyId: CompanyId; appsDomain: AppsDomain },
) {
  const { appsDomain, ...scope } = input
  return database.read({ kind: 'COMPANY', ...scope }, async (tx) => {
    const admitted = await admit({ tx, ...scope, action: 'readCompany' })
    const detail = await companyDetailOf(tx, { companyId: admitted.companyId, appsDomain })
    if (detail.nickname === null && admitted.role !== 'owner') {
      throw new Failure('NOT_FOUND', { details: { reason: 'NO_NICKNAME' } })
    }
    return {
      company: detail,
      role: admitted.role,
      mayInviteAs: mayInviteAs(admitted),
    }
  })
}
