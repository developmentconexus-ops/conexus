export type InvitationMailProps = {
  companyName: string
  inviterName: string
  roleLabel: string
  link: string
  expiresOn: string
  to: string
}

export function renderInvitation(
  props: InvitationMailProps,
): Promise<{ html: string; text: string }>
