import type { CompanyId, InvitationId, Person } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { admitInviter, mayInviteAs } from './admission.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { invitationExpiry, organizationAdapter } from './auth.ts'
import { companyById } from './companies.ts'
import {
  checkNotMember,
  checkPace,
  LIVE,
  lockCompany,
  lockedInviter,
  PendingRow,
  pending,
  pendingOf,
  Status,
} from './invitations.ts'
import { invitation, session } from './tables.ts'

type Manage = {
  person: Person
  companyId: CompanyId
  invitationId: InvitationId
  revision: number
  sessionToken: string
}
const ManagedRow = PendingRow.extend({
  status: Status,
  live: z.boolean(),
  superseded: z.boolean(),
  attemptKey: z.string().min(1),
})

async function admittedInvitation(tx: CommandTx, input: Manage) {
  await lockCompany(tx, input.companyId)
  const [active] = await tx
    .select({ id: session.id })
    .from(session)
    .where(
      and(
        eq(session.token, input.sessionToken),
        eq(session.userId, input.person.id),
        sql`${session.expiresAt} > statement_timestamp()`,
      ),
    )
    .for('share')
  if (active === undefined) throw new Failure('SESSION_REQUIRED')
  const admitted = await admitInviter({
    tx,
    companyId: input.companyId,
    personId: input.person.id,
  })
  const [found] = await tx
    .select({
      ...pending,
      status: invitation.status,
      live: sql<boolean>`${LIVE}`,
      attemptKey: invitation.attemptKey,
      superseded: sql<boolean>`${invitation.supersededAt} is not null`,
    })
    .from(invitation)
    .where(
      and(eq(invitation.id, input.invitationId), eq(invitation.organizationId, input.companyId)),
    )
  const row = ManagedRow.optional().parse(found)
  if (row === undefined) throw new Failure('NOT_FOUND')
  return { admitted, row }
}

function current(row: z.infer<typeof ManagedRow>, input: Manage): void {
  if (row.status !== 'pending') throw new Failure('INVITATION_CLOSED')
  if (row.revision !== input.revision) throw new Failure('INVITATION_STALE')
}

export function cancelInvitationCommand(deps: { auth: Auth; libraryCommand: LibraryCommand }) {
  return (input: Manage) =>
    deps.libraryCommand(async (tx) => {
      const { row } = await admittedInvitation(tx, input)
      if (row.status === 'canceled' && !row.superseded) return false
      current(row, input)
      const adapter = await organizationAdapter(deps.auth)
      await adapter.updateInvitation({ invitationId: row.id, status: 'canceled' })
      await tx
        .update(invitation)
        .set({ revision: sql`${invitation.revision} + 1` })
        .where(eq(invitation.id, row.id))
      return true
    })
}

export function renewInvitationCommand(deps: { auth: Auth; libraryCommand: LibraryCommand }) {
  return (input: Manage) =>
    deps.libraryCommand(async (tx) => {
      const { admitted, row } = await admittedInvitation(tx, input)
      current(row, input)
      if (!row.live) throw new Failure('INVITATION_CLOSED')
      if (!mayInviteAs(admitted).includes(row.role)) throw new Failure('INVITATION_ROLE_REFUSED')
      await lockedInviter(tx, input.person.id)
      await checkNotMember(tx, admitted, row.email)
      await checkPace(tx, input.person.id)
      const [renewed] = await tx
        .update(invitation)
        .set({
          revision: sql`${invitation.revision} + 1`,
          mailedAt: null,
          expiresAt: invitationExpiry(),
        })
        .where(eq(invitation.id, row.id))
        .returning(pending)
      return {
        invitation: pendingOf(PendingRow.parse(renewed)),
        companyName: (await companyById(tx, input.companyId)).name,
      }
    })
}
