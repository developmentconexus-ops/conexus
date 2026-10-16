import type { InvitationId, Person, PersonId } from '@conexus/hub-api'
import { CompanyId, InvitationView, ListedInvitation, PAGE_SIZE } from '@conexus/hub-api'
import { and, asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { admit } from './admission.ts'
import { storedAddress } from './auth.ts'
import { after, pageKey, pageOf } from './companies.ts'
import { LIVE, PendingRow, pending, pendingOf, Status } from './invitations.ts'
import { account, company, invitation, member, user } from './tables.ts'

const ListedRow = PendingRow.extend({ live: z.boolean() })
const ReceivedRow = PendingRow.extend({
  live: z.boolean(),
  status: Status,
  companyId: CompanyId,
  companyName: z.string(),
  inviterName: z.string(),
  hasPassword: z.boolean(),
  joined: z.boolean(),
})
export function readInvitations(
  database: Database,
  input: { personId: PersonId; companyId: CompanyId },
  page: string | undefined,
) {
  return database.read(async (tx) => {
    const admitted = await admit({ tx, ...input, action: 'readInvitations' })
    const key = pageKey(page)
    const rows = await tx
      .select({ ...pending, live: sql<boolean>`${LIVE}` })
      .from(invitation)
      .where(
        and(
          eq(invitation.organizationId, admitted.companyId),
          eq(invitation.status, 'pending'),
          after(sql`(${invitation.createdAt}, ${invitation.id})`, key, (id) =>
            tx
              .select({ createdAt: invitation.createdAt, id: invitation.id })
              .from(invitation)
              .where(and(eq(invitation.id, id), eq(invitation.organizationId, admitted.companyId))),
          ),
        ),
      )
      .orderBy(asc(invitation.createdAt), asc(invitation.id))
      .limit(PAGE_SIZE + 1)
    const parsed = rows.map((row) => ListedRow.parse(row))
    const listed = pageOf(parsed, (row) => row.id)
    return {
      invitations: listed.rows.map((row) =>
        ListedInvitation.parse({ ...pendingOf(row), state: stateOf('pending', row.live) }),
      ),
      next: listed.next,
    }
  })
}

function stateOf(status: z.infer<typeof Status>, live: boolean) {
  switch (status) {
    case 'accepted':
      return 'ACCEPTED'
    case 'canceled':
      return 'CANCELED'
    case 'rejected':
      return 'DECLINED'
    case 'pending':
      return live ? 'PENDING' : 'EXPIRED'
    default:
      return status satisfies never
  }
}

export function readReceived(
  database: Database,
  person: Person | undefined,
  invitationId: InvitationId,
) {
  return database.read(async (tx) => {
    const [found] = await tx
      .select({
        ...pending,
        hasPassword: sql<boolean>`exists (select 1 from ${account}
          inner join ${user} on ${user.id} = ${account.userId}
          where lower(${user.email}) = lower(${invitation.email})
          and ${account.providerId} = 'credential' and ${account.password} is not null)`,
        joined: sql<boolean>`exists (select 1 from ${member}
          where ${member.organizationId} = ${invitation.organizationId}
          and ${member.userId} = ${person?.id ?? ''})`,
        status: invitation.status,
        live: sql<boolean>`${LIVE}`,
        companyId: company.id,
        companyName: company.name,
        inviterName: user.name,
      })
      .from(invitation)
      .innerJoin(company, eq(invitation.organizationId, company.id))
      .innerJoin(user, eq(invitation.inviterId, user.id))
      .where(eq(invitation.id, invitationId))
    const row = ReceivedRow.optional().parse(found)
    if (row === undefined) throw new Failure('NOT_FOUND')
    if (person !== undefined && row.email !== storedAddress(person.email)) {
      return InvitationView.parse({ kind: 'OTHER', signedInAs: person.email })
    }
    const targetCompany = { id: row.companyId, name: row.companyName }
    if (row.status === 'accepted' && person !== undefined && row.joined) {
      return InvitationView.parse({ kind: 'JOINED', company: targetCompany })
    }
    const state = stateOf(row.status, row.live)
    if (state !== 'PENDING') return InvitationView.parse({ kind: 'CLOSED', state })
    const details = {
      company: targetCompany,
      role: row.role,
      inviterName: row.inviterName,
      expiresAt: row.expiresAt.toISOString(),
      revision: row.revision,
    }
    if (person !== undefined) return InvitationView.parse({ kind: 'INVITED', ...details })
    return InvitationView.parse({
      kind: row.hasPassword ? 'HAS_PASSWORD' : 'NEW',
      email: row.email,
      ...details,
    })
  })
}
