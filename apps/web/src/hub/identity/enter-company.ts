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

async function readCompany(context: { queryClient: QueryClient }, companyId: CompanyId) {
  return readOrNotFound(context.queryClient.ensureQueryData(companyQuery(companyId)))
}

/**
 * The guard of a company's house and Configurações. The Hub answers 404 for a company the person
 * cannot open, which is not found here too. A company without its nickname opens its first entry,
 * which only its owner sees (web W33).
 */
export async function enterHouse(input: {
  context: { queryClient: QueryClient }
  companyId: CompanyId
}): Promise<{ company: CompanyDetail; role: Role }> {
  const { company, role } = await readCompany(input.context, input.companyId)
  if (company.nickname === null) {
    const params = { companyId: input.companyId }
    throw redirect({ to: '/companies/$companyId/welcome', params, replace: true })
  }
  return { company, role }
}

/**
 * The guard of the first entry (web W33): anyone but the owner goes to Início; step 1 is the only
 * step until the nickname is saved, and once saved step 1 does not open again. `atStepOne` is
 * whether the navigation ends at step 1's route.
 */
export async function enterWelcome(input: {
  context: { queryClient: QueryClient }
  companyId: CompanyId
  atStepOne: boolean
}): Promise<void> {
  const params = { companyId: input.companyId }
  const { company, role } = await readCompany(input.context, input.companyId)
  if (role !== 'owner') throw redirect({ to: '/companies/$companyId', params, replace: true })
  const named = company.nickname !== null
  if (!named && !input.atStepOne) {
    throw redirect({ to: '/companies/$companyId/welcome/company', params, replace: true })
  }
  if (named && input.atStepOne) {
    throw redirect({ to: '/companies/$companyId/welcome/model-account', params, replace: true })
  }
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
 * The options a company's frame route spreads: its parsed parameter and the company remembered as
 * the last one opened (web W30). A switch only changes the company in the address, which the router
 * calls staying, so staying remembers too. Each route adds its guard, `enterHouse` or `enterWelcome`.
 */
export const companyEntry = {
  params: companyParams,
  onEnter: rememberCompany,
  onStay: rememberCompany,
}
