import type { CompanyId, InvitationId, Person, PersonId, ProjectId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx, Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { CompanyProof } from './admission.ts'
import { admit, admitCompany } from './admission.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { invitationExpiry, organizationAdapter, refusedAs } from './auth.ts'
import { companyById } from './companies.ts'
import {
  CompanyPendingRow,
  cancelThrough,
  checkPace,
  companyScope,
  INVITATION_REFUSALS,
  inviterOf,
  LIVE,
  lockCompany,
  lockedInviter,
  OF_COMPANY,
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
  headers: Headers
}
// The company's routes renew and cancel only its own invitations; an app's is not found here.
const ManagedRow = CompanyPendingRow.extend({
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
  const admitted = await admitCompany({
    tx,
    companyId: input.companyId,
    personId: input.person.id,
    action: 'invite',
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
      and(
        eq(invitation.id, input.invitationId),
        eq(invitation.organizationId, input.companyId),
        OF_COMPANY,
      ),
    )
  const row = ManagedRow.optional().parse(found)
  if (row === undefined) throw new Failure('NOT_FOUND')
  return { admitted, row }
}

function current(row: z.infer<typeof ManagedRow>, input: Manage): void {
  if (row.status !== 'pending') throw new Failure('INVITATION_CLOSED')
  if (row.revision !== input.revision) throw new Failure('INVITATION_STALE')
}

/**
 * Cancels what a person sent to a company when they leave it, as a cancel does: the status closes
 * and the revision advances, so a screen reading the old one meets INVITATION_STALE. An expired one
 * still holds its address in the unique index, so it is canceled too (data D15).
 */
export async function cancelSentBy(
  tx: CommandTx,
  input: { companyId: CompanyId; personId: PersonId },
): Promise<void> {
  await tx
    .update(invitation)
    .set({ status: 'canceled', revision: sql`${invitation.revision} + 1` })
    .where(
      and(
        eq(invitation.organizationId, input.companyId),
        eq(invitation.inviterId, input.personId),
        eq(invitation.status, 'pending'),
      ),
    )
}

export function cancelInvitationCommand(deps: { auth: Auth; libraryCommand: LibraryCommand }) {
  return (input: Manage) =>
    deps.libraryCommand(companyScope(input), async (tx) => {
      const { admitted, row } = await admittedInvitation(tx, input)
      if (row.status === 'canceled' && !row.superseded) return false
      current(row, input)
      const { headers } = input
      await cancelThrough(deps.auth, { admitted, headers, invitationId: row.id, kind: row.kind })
      await tx
        .update(invitation)
        .set({ revision: sql`${invitation.revision} + 1` })
        .where(eq(invitation.id, row.id))
      return true
    })
}

/**
 * Cancels an app's open invitation, by the capability to manage who uses the apps (step 18, B),
 * through the plugin's adapter: its endpoint would check the plugin's own permission to cancel
 * (docs/reference/boundaries.md). A repeat answers as the first; an accepted one is not found.
 */
export function cancelAppInvitationCommand(deps: { auth: Auth; libraryCommand: LibraryCommand }) {
  return (input: {
    person: Person
    companyId: CompanyId
    projectId: ProjectId
    invitationId: InvitationId
  }) =>
    deps.libraryCommand(companyScope(input), async (tx) => {
      await lockCompany(tx, input.companyId)
      const { companyId } = input
      await admit({ tx, personId: input.person.id, companyId, action: 'manageAppAccess' })
      const [found] = await tx
        .select({ status: invitation.status })
        .from(invitation)
        .where(
          and(
            eq(invitation.id, input.invitationId),
            eq(invitation.organizationId, companyId),
            eq(invitation.projectId, input.projectId),
          ),
        )
      const status = Status.optional().parse(found?.status)
      if (status === 'canceled') return false
      if (status !== 'pending') throw new Failure('NOT_FOUND')
      const adapter = await organizationAdapter(deps.auth)
      await adapter.updateInvitation({ invitationId: input.invitationId, status: 'canceled' })
      await tx
        .update(invitation)
        .set({ revision: sql`${invitation.revision} + 1` })
        .where(eq(invitation.id, input.invitationId))
      return true
    })
}

/**
 * Renews the invitation: a member's through the plugin's endpoint with `resend`, which owns the roles,
 * the member check and the new expiry; the operator's, who is no member, here.
 */
async function renewed(
  deps: { auth: Auth },
  tx: CommandTx,
  input: { admitted: CompanyProof; row: z.infer<typeof ManagedRow>; headers: Headers },
) {
  const { admitted, row } = input
  if (admitted.kind === 'MEMBER') {
    const body = {
      email: row.email,
      role: row.role,
      organizationId: admitted.companyId,
      resend: true,
      attemptKey: row.attemptKey,
    }
    await refusedAs(
      () => deps.auth.api.createInvitation({ headers: input.headers, body }),
      INVITATION_REFUSALS,
    )
  }
  const [renewal] = await tx
    .update(invitation)
    .set({
      revision: sql`${invitation.revision} + 1`,
      mailedAt: null,
      ...(admitted.kind === 'COMPANY_OPERATOR' ? { expiresAt: invitationExpiry() } : {}),
    })
    .where(eq(invitation.id, row.id))
    .returning(pending)
  return pendingOf(CompanyPendingRow.parse(renewal))
}

export function renewInvitationCommand(deps: {
  auth: Auth
  database: Database
  libraryCommand: LibraryCommand
}) {
  return (input: Manage) =>
    deps.libraryCommand(companyScope(input), async (tx) => {
      const { admitted, row } = await admittedInvitation(tx, input)
      current(row, input)
      if (!row.live) throw new Failure('INVITATION_CLOSED')
      // The operator's admission already holds the row.
      if (admitted.kind === 'MEMBER') await lockedInviter(tx, input.person.id)
      await checkPace(deps.database, tx, input.person.id)
      return {
        invitation: await renewed(deps, tx, { admitted, row, headers: input.headers }),
        companyName: (await companyById(tx, input.companyId)).name,
        inviter: inviterOf(admitted, input.person),
      }
    })
}
