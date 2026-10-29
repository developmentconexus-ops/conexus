/** What the invitation gives: a company's first owner, a role in the company, or the use of an app. */
export type InvitedAs =
  | { kind: 'FIRST_OWNER' }
  | { kind: 'COMPANY'; roleLabel: string }
  | { kind: 'APP'; appName: string }

export type InvitationMailProps = {
  companyName: string
  inviterName: string
  invited: InvitedAs
  link: string
  expiresOn: string
  to: string
}

export function renderInvitation(
  props: InvitationMailProps,
): Promise<{ html: string; text: string }>

export type PasswordRecoveryMailProps = {
  name: string
  to: string
  link: string
  validity: string
}

export function renderPasswordRecovery(
  props: PasswordRecoveryMailProps,
): Promise<{ html: string; text: string }>
