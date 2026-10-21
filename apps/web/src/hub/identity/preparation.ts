import type { ListedInvitation, Member } from '@conexus/hub-api'

/** A team is another person in the company or an invitation still open (web W33). */
export function teamDone(input: {
  members: readonly Member[]
  invitations: readonly Pick<ListedInvitation, 'state'>[]
}): boolean {
  const others = input.members.length - 1
  return others > 0 || input.invitations.some((invitation) => invitation.state === 'PENDING')
}

/**
 * What of the company's first entry is still open after its nickname, which every page past step 1
 * already has: a model account of the company, and a team. The steps and the card on Início read
 * this one answer.
 */
export function preparationOf(input: {
  companyAccounts: number
  members: readonly Member[]
  invitations: readonly Pick<ListedInvitation, 'state'>[]
}): { modelAccount: boolean; team: boolean } {
  return { modelAccount: input.companyAccounts > 0, team: teamDone(input) }
}
