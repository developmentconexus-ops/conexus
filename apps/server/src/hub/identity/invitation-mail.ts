import type { PendingInvitation } from '@conexus/hub-api'
import { and, eq, isNull, sql } from 'drizzle-orm'
import type { CommandTx, Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { SendMail } from '../../platform/mail.ts'
import { invitationMail } from './messages.ts'
import { invitation } from './tables.ts'

async function markMailed(tx: CommandTx, sent: PendingInvitation): Promise<void> {
  await tx
    .update(invitation)
    .set({ mailedAt: sql`statement_timestamp()` })
    .where(
      and(
        eq(invitation.id, sent.id),
        eq(invitation.revision, sent.revision),
        isNull(invitation.mailedAt),
      ),
    )
}

/**
 * Sends the invitation's e-mail after the commit and marks it once the provider answered, delivered,
 * queued or bounced, so no replay sends it again. An unavailable provider may not have sent, so
 * nothing is marked and the failure leaves as it came.
 */
export async function mailInvitation(
  deps: { database: Database; sendMail: SendMail },
  input: {
    invitation: PendingInvitation
    companyName: string
    inviterName: string
    link: string
    signal: AbortSignal
  },
): Promise<void> {
  const { invitation: sent, signal } = input
  const message = invitationMail({
    to: sent.email,
    role: sent.role,
    companyName: input.companyName,
    inviterName: input.inviterName,
    link: input.link,
  })
  async function mark(): Promise<void> {
    await deps.database.command((tx) => markMailed(tx, sent))
  }
  try {
    await deps.sendMail(message, signal)
  } catch (error) {
    if (error instanceof Failure && error.code === 'MAIL_BOUNCED') await mark()
    throw error
  }
  await mark()
}
