import { CompanyId } from '@conexus/hub-api'
import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { companyQuery } from '../../../hub/identity/public.ts'
import { idOrNotFound, readOrNotFound } from '../../../platform/hub.ts'

export const Route = createFileRoute('/_app/companies/$companyId')({
  params: {
    parse: (raw) => ({ companyId: idOrNotFound(CompanyId, raw.companyId) }),
    stringify: (p) => p,
  },
  // A company without a nickname opens its setup before any page, for its owner; to everyone else
  // it is not found, as the Hub hides what a person may not see. Once it has one, its setup stays
  // open as the page of the company's settings.
  beforeLoad: async ({ context, params, location }) => {
    const { company, role } = await readOrNotFound(
      context.queryClient.ensureQueryData(companyQuery(params.companyId)),
    )
    const settingUp = location.pathname === `/companies/${params.companyId}/setup`
    if (company.nickname === null && role !== 'owner') throw notFound()
    if (company.nickname === null && !settingUp) {
      throw redirect({ to: '/companies/$companyId/setup', params, replace: true })
    }
  },
})
