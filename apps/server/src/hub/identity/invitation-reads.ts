import type { InvitationId, Person, PersonId } from '@conexus/hub-api'
import { CompanyId, PAGE_SIZE, ReceivedInvitation } from '@conexus/hub-api'
import { and, asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { admit } from './admission.ts'
import { storedAddress } from './auth.ts'
import { after, pageKey, pageOf } from './companies.ts'
import { LIVE, PendingRow, pending, pendingOf, Status } from './invitations.ts'
import { company, invitation, user } from './tables.ts'

const ReceivedRow = PendingRow.omit({ expiresAt: true }).extend({
  live: z.boolean(),
  status: Status,
  companyId: CompanyId,
  companyName: z.string(),
  inviterName: z.string(),
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
      .select(pending)
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
    const parsed = rows.map((row) => PendingRow.parse(row))
    const listed = pageOf(parsed, (row) => row.id)
    return { invitations: listed.rows.map(pendingOf), next: listed.next }
  })
}

function stateOf(status: z.infer<typeof Status>, live: boolean): ReceivedInvitation['state'] {
  if (status === 'accepted') return 'ACCEPTED'
  if (status === 'canceled') return 'CANCELED'
  return live ? 'PENDING' : 'EXPIRED'
}

/** The invitation as the person it was sent to reads it; anyone else finds nothing (S10). */
export function readReceived(database: Database, person: Person, invitationId: InvitationId) {
  return database.read(async (tx) => {
    const [found] = await tx
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
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
    if (row === undefined || row.email !== storedAddress(person.email)) {
      throw new Failure('NOT_FOUND', { details: { reason: 'OUTSIDER' } })
    }
    return ReceivedInvitation.parse({
      id: row.id,
      company: { id: row.companyId, name: row.companyName },
      role: row.role,
      inviterName: row.inviterName,
      state: stateOf(row.status, row.live),
    })
  })
}
