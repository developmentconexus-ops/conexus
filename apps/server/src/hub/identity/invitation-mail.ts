import type { PendingInvitation } from '@conexus/hub-api'
import { and, eq, isNull, sql } from 'drizzle-orm'
import type { CommandTx, Database, Scope } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { SendMail } from '../../platform/mail.ts'
import type { Inviter } from './messages.ts'
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

/** What the provider answered: it took the e-mail, or it refused the address (code C49). */
export type MailOutcome = { kind: 'SENT' } | { kind: 'BOUNCED' }

/**
 * Sends the invitation's e-mail after the commit and marks it once the provider answered, delivered,
 * queued or bounced, so no replay sends it again, in a transaction of the sender's scope. An
 * unavailable provider may not have sent, so nothing is marked and the failure leaves as it came.
 */
export async function mailInvitation(
  deps: { database: Database; sendMail: SendMail },
  input: {
    scope: Scope
    invitation: PendingInvitation
    companyName: string
    inviter: Inviter
    link: string
    signal: AbortSignal
  },
): Promise<MailOutcome> {
  const { invitation: sent, signal } = input
  const message = await invitationMail({
    to: sent.email,
    role: sent.role,
    expiresAt: sent.expiresAt,
    companyName: input.companyName,
    inviter: input.inviter,
    link: input.link,
  })
  async function mark(): Promise<void> {
    await deps.database.command(input.scope, (tx) => markMailed(tx, sent))
  }
  try {
    await deps.sendMail(message, signal)
  } catch (error) {
    if (!(error instanceof Failure && error.code === 'MAIL_BOUNCED')) throw error
    await mark()
    return { kind: 'BOUNCED' }
  }
  await mark()
  return { kind: 'SENT' }
}

/** A member's invitation to an address the provider refused answers that failure (step 4.1). */
export function deliveredOrRefused(outcome: MailOutcome): void {
  if (outcome.kind === 'BOUNCED') throw new Failure('MAIL_BOUNCED')
}
