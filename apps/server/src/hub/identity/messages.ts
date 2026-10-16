import type { Email, Role } from '@conexus/hub-api'
import { ROLE_LABELS } from '@conexus/hub-api'
import type { MailMessage } from '../../platform/mail.ts'
import { PASSWORD_LINK_SECONDS } from './auth.ts'
import { renderInvitation } from './invitation-render.mjs'

const LINK_MINUTES = PASSWORD_LINK_SECONDS / 60

/** The words that carry a one-use password link, in an e-mail or in the first person's summary. */
export function passwordLinkText(name: string, link: string): string {
  return `Link para ${name} criar a senha do Conexus. Vale ${LINK_MINUTES} minutos e uma vez só.\n\n${link}\n`
}

export async function invitationMail(input: {
  to: Email
  companyName: string
  inviterName: string
  role: Role
  link: string
  expiresAt: string
}): Promise<MailMessage> {
  return {
    to: input.to,
    subject: `Convite para ${input.companyName}`,
    ...(await renderInvitation({
      to: input.to,
      companyName: input.companyName,
      inviterName: input.inviterName,
      roleLabel: ROLE_LABELS[input.role],
      link: input.link,
      expiresOn: `${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(input.expiresAt))} UTC`,
    })),
  }
}
