import type { Email, Role } from '@conexus/hub-api'
import { INVITATION_SECONDS, PASSWORD_LINK_SECONDS } from './auth.ts'

type Mail = { to: Email; subject: string; text: string }

const ROLE_NAMES: Record<Role, string> = {
  owner: 'Dono',
  admin: 'Administrador',
  member: 'Membro',
}

const LINK_MINUTES = PASSWORD_LINK_SECONDS / 60
const INVITATION_DAYS = INVITATION_SECONDS / (24 * 60 * 60)

/** The words that carry a one-use password link, in an e-mail or in the first person's summary. */
export function passwordLinkText(name: string, link: string): string {
  return `Link para ${name} criar a senha do Conexus. Vale ${LINK_MINUTES} minutos e uma vez só.\n\n${link}\n`
}

export function invitationMail(input: {
  to: Email
  companyName: string
  inviterName: string
  role: Role
  link: string
}): Mail {
  return {
    to: input.to,
    subject: `Convite para ${input.companyName}`,
    text: [
      `${input.inviterName} convidou você para ${input.companyName} como ${ROLE_NAMES[input.role]}.`,
      `O convite vale ${INVITATION_DAYS} dias.`,
      '',
      input.link,
      '',
    ].join('\n'),
  }
}

export function passwordLinkMail(input: { to: Email; name: string; link: string }): Mail {
  return {
    to: input.to,
    subject: 'Crie sua senha do Conexus',
    text: passwordLinkText(input.name, input.link),
  }
}
