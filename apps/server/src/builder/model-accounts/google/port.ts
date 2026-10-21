import type { CompanyId, ModelAccountId, PersonId, ProviderId } from '@conexus/hub-api'
import type { Scope } from '../../../platform/database.ts'
import type { Credential } from '../../../platform/seal.ts'

export type GoogleAccount = {
  id: ModelAccountId
  companyId: CompanyId
  personId: PersonId | null
  provider: ProviderId
  revision: number
  credential: Credential
}

/**
 * The process of a Google account that takes its calls on this machine (step 12 U10); `hold`
 * keeps it while a call runs and gives back its release.
 */
export type GoogleCalls = (
  account: GoogleAccount,
  scope: Scope,
) => Promise<{ url: string; apiKey: string; hold: () => () => void }>
