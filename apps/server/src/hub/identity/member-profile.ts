import type { CompanyId, Member, Person, PersonId } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { Database, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { admitProfileWriter } from './admission.ts'
import { companyScope, lockCompany } from './invitations.ts'
import { memberViewed } from './memberships.ts'
import { member } from './tables.ts'

/** The job title and department the member wrote, `null` for what they left blank. */
export async function memberProfileOf(
  tx: ReadTx,
  input: { companyId: CompanyId; personId: PersonId },
): Promise<{ jobTitle: string | null; department: string | null }> {
  const [row] = await tx
    .select({ jobTitle: member.jobTitle, department: member.department })
    .from(member)
    .where(and(eq(member.organizationId, input.companyId), eq(member.userId, input.personId)))
  return row ?? { jobTitle: null, department: null }
}

/**
 * Replaces a member's job title and department, whole: the same texts again leave the same member.
 * The person writes their own; for another, the company's lock orders it with every change of
 * people and the admission asks the permission to change roles (code C65).
 */
export function writeMemberProfile(
  database: Database,
  input: {
    person: Person
    companyId: CompanyId
    personId: PersonId
    jobTitle: string | null
    department: string | null
  },
): Promise<Member> {
  return database.command(companyScope(input), async (tx) => {
    await lockCompany(tx, input.companyId)
    const admitted = await admitProfileWriter({
      tx,
      personId: input.person.id,
      companyId: input.companyId,
      owner: input.personId,
    })
    const [written] = await tx
      .update(member)
      .set({ jobTitle: input.jobTitle, department: input.department })
      .where(and(eq(member.organizationId, input.companyId), eq(member.userId, input.personId)))
      .returning({ id: member.id })
    const viewed =
      written === undefined
        ? undefined
        : await memberViewed(tx, {
            admitted,
            viewerId: input.person.id,
            personId: input.personId,
          })
    if (viewed === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'NO_MEMBER' } })
    return viewed
  })
}
