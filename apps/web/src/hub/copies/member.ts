import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { companyQuery } from '../identity/public.ts'
import { copyReadersQuery } from './queries.ts'

const company = getRouteApi('/_app/companies/$companyId')

/** What the Hub says the person may do in this company (web W8). */
export function useMay() {
  return company.useRouteContext().may
}

/** The label of the person's own role, found among the roles that read the tables they see; none until read, or when no table names it. */
export function useOwnRoleLabel(companyId: CompanyId): string | undefined {
  const person = useQuery(companyQuery(companyId))
  const readers = useQuery(copyReadersQuery(companyId))
  const role = person.data?.role
  return readers.data?.readers.flatMap((one) => one.roles).find((one) => one.role === role)?.label
}
