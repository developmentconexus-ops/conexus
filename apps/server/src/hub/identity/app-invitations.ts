import type { AppEntry, CompanyId } from '@conexus/hub-api'
import { PersonId, ProjectId } from '@conexus/hub-api'
import { and, asc, eq, isNotNull, sql } from 'drizzle-orm'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { Auth } from './auth.ts'
import { organizationAdapter, storedAddress } from './auth.ts'
import { ADDRESS, AppPendingRow, appInvitationOf, LIVE, pending } from './invitations.ts'
import { invitation, member, user } from './tables.ts'

/**
 * What an app's invitation asks of Projects (code C4), which owns the Projeto, the rows of who uses
 * its app and the roles of its published version. `main.ts` hands it over with the routes, Projects
 * being made after identity.
 */
export type ProjectApps = {
  /** Refuses what the app cannot take; `personId` is the person of the address, if there is one. */
  checkInvitation(
    tx: CommandTx,
    input: { companyId: CompanyId; projectId: ProjectId; role: string | null; personId?: PersonId },
  ): Promise<void>
  /** The app of a Projeto still there: its name, and the address it opens at. */
  appOf(
    tx: ReadTx,
    ids: { companyId: CompanyId; projectId: ProjectId },
  ): Promise<Omit<AppEntry, 'companyName'> | undefined>
  /** Whether the person uses the app now. */
  uses(tx: ReadTx, ids: { projectId: ProjectId; personId: PersonId }): Promise<boolean>
  /** Writes the row an accepted invitation gives, in the invitation's scope. */
  grant(
    tx: CommandTx,
    row: { companyId: CompanyId; projectId: ProjectId; personId: PersonId; role: string | null },
  ): Promise<void>
}

/**
 * Cancels the open invitations to the company's apps for an address, all of them or one Projeto's,
 * through the plugin's adapter, and answers their Projetos. A company invitation replaces them, a
 * member using every app (E1), and the plugin would refuse it while any is open
 * (better-auth 1.7.8 crud-invites.mjs:128-132).
 */
export async function cancelAppInvitations(
  auth: Auth,
  tx: CommandTx,
  input: { companyId: CompanyId; email: string; projectId?: ProjectId },
): Promise<ProjectId[]> {
  const open = await tx
    .select({ id: invitation.id, projectId: invitation.projectId })
    .from(invitation)
    .where(
      and(
        eq(invitation.organizationId, input.companyId),
        sql`${ADDRESS} = ${storedAddress(input.email)}`,
        isNotNull(invitation.projectId),
        input.projectId === undefined ? undefined : eq(invitation.projectId, input.projectId),
        eq(invitation.status, 'pending'),
      ),
    )
  const adapter = await organizationAdapter(auth)
  const canceled: ProjectId[] = []
  for (const row of open) {
    await adapter.updateInvitation({ invitationId: row.id, status: 'canceled' })
    await tx
      .update(invitation)
      .set({ revision: sql`${invitation.revision} + 1` })
      .where(eq(invitation.id, row.id))
    canceled.push(ProjectId.parse(row.projectId))
  }
  return canceled
}

/** The open invitations to a Projeto's app, the oldest first, for its list (step 18, B2). */
export async function openAppInvitations(
  tx: ReadTx,
  ids: { companyId: CompanyId; projectId: ProjectId },
) {
  const rows = await tx
    .select(pending)
    .from(invitation)
    .where(
      and(
        eq(invitation.organizationId, ids.companyId),
        eq(invitation.projectId, ids.projectId),
        eq(invitation.status, 'pending'),
        LIVE,
      ),
    )
    .orderBy(asc(invitation.createdAt), asc(invitation.id))
  return rows.map((row) => appInvitationOf(AppPendingRow.parse(row)))
}

/** The port's form: the address's open invitations to the company's apps, in a library command. */
export function cancelAppInvitationsOf(auth: Auth) {
  return (tx: CommandTx, input: { companyId: CompanyId; email: string; projectId?: ProjectId }) =>
    cancelAppInvitations(auth, tx, input)
}

/** A member already uses every app of the company (E1): an app is never given to one. */
async function checkNotMember(tx: CommandTx, companyId: CompanyId, email: string) {
  const [found] = await tx
    .select({ id: member.id })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(and(eq(member.organizationId, companyId), sql`lower(${user.email}) = ${email}`))
  if (found !== undefined) throw new Failure('APP_ACCESS_MEMBER')
}

async function personOfAddress(tx: CommandTx, email: string) {
  const [found] = await tx.select({ id: user.id }).from(user).where(eq(user.email, email))
  return found === undefined ? undefined : PersonId.parse(found.id)
}

/**
 * What an app's invitation needs before the write, under the company's lock: an address no member
 * holds, and what Projects refuses of the app and of the person the address belongs to.
 */
export async function checkAppInvitation(
  tx: CommandTx,
  input: { companyId: CompanyId; email: string; projectId: ProjectId; role: string | null },
  apps: ProjectApps,
): Promise<void> {
  const { companyId, email, projectId, role } = input
  await checkNotMember(tx, companyId, email)
  const personId = await personOfAddress(tx, email)
  await apps.checkInvitation(tx, { companyId, projectId, role, personId })
}
