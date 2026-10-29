import { createFileRoute, redirect } from '@tanstack/react-router'
import { companiesQuery, lastCompanyOf, myAppsQuery, NoCompany } from '../../hub/identity/public.ts'

/**
 * "/" opens a company (web W30): the one this browser opened last, while the Hub still lists it on
 * the first page, else the first listed; the operator with no company, the Central.
 */
export const Route = createFileRoute('/_app/')({
  beforeLoad: async ({ context }) => {
    const { companies, mayOperate } = await context.queryClient.ensureQueryData(
      companiesQuery(undefined),
    )
    const last = lastCompanyOf(context.person.id)
    const opened = companies.find(({ company }) => company.id === last) ?? companies[0]
    if (opened !== undefined) {
      throw redirect({ to: '/companies/$companyId', params: { companyId: opened.company.id } })
    }
    if (mayOperate) throw redirect({ to: '/operations' })
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(myAppsQuery),
  component: NoCompany,
})
