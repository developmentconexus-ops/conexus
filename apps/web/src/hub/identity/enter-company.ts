import type { CompanyDetail, PersonId, Role } from '@conexus/hub-api'
import { CompanyId } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'
import { idOrNotFound, readOrNotFound } from '../../platform/hub.ts'
import { recall, remember } from '../../platform/remembered.ts'
import { companyQuery } from './queries.ts'

/** A company's address parameter, parsed; an id the Hub would never issue is not found. */
export const companyParams = {
  parse: (raw: { companyId: string }) => ({ companyId: idOrNotFound(CompanyId, raw.companyId) }),
  stringify: (params: { companyId: CompanyId }) => params,
}

/**
 * The guard of a company's three frames. The Hub answers 404 for a company the person cannot open,
 * which is not found here too. A company without its nickname opens its first entry, which only its
 * owner sees (step 12.2, W33); the first entry opens only for an owner, and anyone else goes to the
 * company's Início.
 */
export async function enterCompany(input: {
  context: { queryClient: QueryClient }
  companyId: CompanyId
  frame: 'house' | 'welcome'
}): Promise<{ company: CompanyDetail; role: Role }> {
  const params = { companyId: input.companyId }
  const { company, role } = await readOrNotFound(
    input.context.queryClient.ensureQueryData(companyQuery(input.companyId)),
  )
  if (input.frame === 'house' && company.nickname === null) {
    throw redirect({ to: '/companies/$companyId/welcome', params, replace: true })
  }
  if (input.frame === 'welcome' && role !== 'owner') {
    throw redirect({ to: '/companies/$companyId', params, replace: true })
  }
  return { company, role }
}

const COMPANIES = 'companies'

/** The company this browser opened last for the person, if any. */
export function lastCompanyOf(personId: PersonId): CompanyId | undefined {
  const last = CompanyId.safeParse(recall(COMPANIES, personId)[0])
  return last.success ? last.data : undefined
}

export function rememberCompany(personId: PersonId, companyId: CompanyId): void {
  remember(COMPANIES, personId, companyId, 1)
}
