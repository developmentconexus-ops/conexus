import type { Email, Role } from '@conexus/hub-api'
import { ROLE_LABELS } from '@conexus/hub-api'
import type { MailMessage } from '../../platform/mail.ts'
import { PASSWORD_LINK_SECONDS } from './auth.ts'
import type { InvitedAs } from './invitation-render.mjs'
import { renderInvitation, renderPasswordRecovery } from './invitation-render.mjs'

const LINK_VALIDITY = new Intl.NumberFormat('pt-BR', {
  style: 'unit',
  unit: 'hour',
  unitDisplay: 'long',
}).format(PASSWORD_LINK_SECONDS / 3600)

/** Who the Operations Central invites as: it invites a company's first owner, and another owner later. */
export const CONEXUS = 'Conexus'

/** The words that carry a one-use password link, in an e-mail or in the first person's summary. */
export function passwordLinkText(name: string, link: string): string {
  return `Link para ${name} criar a senha do Conexus. Vale ${LINK_VALIDITY} e uma vez só.\n\n${link}\n`
}

/** Who an invitation comes from: a member, or Conexus, for a client's first owner or a later one. */
export type Inviter = { kind: 'MEMBER'; name: string } | { kind: 'CONEXUS'; firstOwner: boolean }

/** What an invitation gives: a role in the company, or the use of one of its apps (step 18). */
export type InvitationGives = { kind: 'COMPANY'; role: Role } | { kind: 'APP'; appName: string }

function invitedAs(input: { inviter: Inviter; gives: InvitationGives }): InvitedAs {
  if (input.gives.kind === 'APP') return { kind: 'APP', appName: input.gives.appName }
  if (input.inviter.kind === 'CONEXUS' && input.inviter.firstOwner) return { kind: 'FIRST_OWNER' }
  return { kind: 'COMPANY', roleLabel: ROLE_LABELS[input.gives.role] }
}

function subjectOf(invited: InvitedAs, companyName: string): string {
  switch (invited.kind) {
    case 'FIRST_OWNER':
      return `${CONEXUS} convidou você para ser o primeiro dono de ${companyName}`
    case 'COMPANY':
      return `Convite para ${companyName}`
    case 'APP':
      return `Convite para usar o app ${invited.appName}`
    default:
      return invited satisfies never
  }
}

export async function invitationMail(input: {
  to: Email
  companyName: string
  inviter: Inviter
  gives: InvitationGives
  link: string
  expiresAt: string
}): Promise<MailMessage> {
  const invited = invitedAs(input)
  return {
    to: input.to,
    subject: subjectOf(invited, input.companyName),
    ...(await renderInvitation({
      to: input.to,
      companyName: input.companyName,
      inviterName: input.inviter.kind === 'CONEXUS' ? CONEXUS : input.inviter.name,
      invited,
      link: input.link,
      expiresOn: `${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(input.expiresAt))} UTC`,
    })),
  }
}

/** The e-mail that carries a recovery link to a person who forgot the password. */
export async function recoveryMail(input: {
  to: Email
  name: string
  link: string
}): Promise<MailMessage> {
  return {
    to: input.to,
    subject: 'Crie uma senha nova no Conexus',
    ...(await renderPasswordRecovery({ ...input, validity: LINK_VALIDITY })),
  }
}
