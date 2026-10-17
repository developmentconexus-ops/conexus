export type InvitationMailProps = {
  companyName: string
  inviterName: string
  firstOwner: boolean
  roleLabel: string
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
