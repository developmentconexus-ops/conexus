import { getRouteApi } from '@tanstack/react-router'

const company = getRouteApi('/_app/companies/$companyId')

/** What the Hub says the person may do in this company (web W8). */
export function useMay() {
  return company.useRouteContext().may
}
