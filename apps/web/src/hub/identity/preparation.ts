import type { CompanyNickname } from '@conexus/hub-api'

/**
 * What of the company's first entry is done (web W33): its nickname, a model account of the
 * company, and a team, another person or an invitation still open. The steps and the card on
 * Início read this one answer.
 */
export function preparationOf(input: {
  nickname: CompanyNickname | null
  others: number
  pending: number
  companyAccounts: number
}): { company: boolean; modelAccount: boolean; team: boolean } {
  return {
    company: input.nickname !== null,
    modelAccount: input.companyAccounts > 0,
    team: input.others + input.pending > 0,
  }
}
