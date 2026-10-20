import type { CompanyDetail, PersonId, Role } from '@conexus/hub-api'
import { CompanyId } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'
import { idOrNotFound, readOrNotFound } from '../../platform/hub.ts'
import type { RememberedList } from '../../platform/remembered.ts'
import { recall, remember } from '../../platform/remembered.ts'
import { companyQuery } from './queries.ts'

/** A company's address parameter, parsed; an id the Hub would never issue is not found. */
const companyParams = {
  parse: (raw: { companyId: string }) => ({ companyId: idOrNotFound(CompanyId, raw.companyId) }),
  stringify: (params: { companyId: CompanyId }) => params,
}

/**
 * The guard of a company's three frames. The Hub answers 404 for a company the person cannot open,
 * which is not found here too. A company without its nickname opens its first entry, which only its
 * owner sees (web W33); there step 1 is the only step until the nickname is saved, and once saved
 * step 1 does not open again. Anyone but the owner goes from the first entry to Início.
 */
async function enterCompany(input: {
  context: { queryClient: QueryClient }
  companyId: CompanyId
  pathname: string
  frame: 'house' | 'welcome'
}): Promise<{ company: CompanyDetail; role: Role }> {
  const params = { companyId: input.companyId }
  const { company, role } = await readOrNotFound(
    input.context.queryClient.ensureQueryData(companyQuery(input.companyId)),
  )
  const named = company.nickname !== null
  if (input.frame === 'house') {
    if (!named) throw redirect({ to: '/companies/$companyId/welcome', params, replace: true })
    return { company, role }
  }
  if (role !== 'owner') throw redirect({ to: '/companies/$companyId', params, replace: true })
  const atStepOne = input.pathname === `/companies/${input.companyId}/welcome/company`
  if (!named && !atStepOne) {
    throw redirect({ to: '/companies/$companyId/welcome/company', params, replace: true })
  }
  if (named && atStepOne) {
    throw redirect({ to: '/companies/$companyId/welcome/model-account', params, replace: true })
  }
  return { company, role }
}

const COMPANIES: RememberedList<typeof CompanyId> = { name: 'companies', id: CompanyId, keep: 1 }

/** The company this browser opened last for the person, if any. */
export function lastCompanyOf(personId: PersonId): CompanyId | undefined {
  return recall({ list: COMPANIES, personId })[0]
}

function rememberCompany(input: {
  context: { person: { id: PersonId } }
  params: { companyId: CompanyId }
}): void {
  remember({ list: COMPANIES, personId: input.context.person.id, id: input.params.companyId })
}

/**
 * The options a company's frame route spreads: its parsed parameter, the guard of `frame`, and the
 * company remembered as the last one opened (web W30). A switch only changes the company in the
 * address, which the router calls staying, so staying remembers too.
 */
export function companyEntry(frame: 'house' | 'welcome') {
  return {
    params: companyParams,
    beforeLoad: (input: {
      context: { queryClient: QueryClient }
      params: { companyId: CompanyId }
      location: { pathname: string }
    }) =>
      enterCompany({
        context: input.context,
        companyId: input.params.companyId,
        pathname: input.location.pathname,
        frame,
      }),
    onEnter: rememberCompany,
    onStay: rememberCompany,
  }
}
