import { createFileRoute } from '@tanstack/react-router'
import {
  accountsQuery,
  CompanyAccounts,
  providersQuery,
} from '../../../../builder/model-accounts/public.ts'
import { CompanySetup, companyQuery, membersQuery } from '../../../../hub/identity/public.ts'
import { readOrNotFound } from '../../../../platform/hub.ts'

function Setup() {
  return (
    <CompanySetup>
      <CompanyAccounts />
    </CompanySetup>
  )
}

export const Route = createFileRoute('/_app/companies/$companyId/setup')({
  staticData: { place: 'Configurar a empresa' },
  // The model accounts are read once the company has its nickname; before it, only the nickname form.
  loader: async ({ context, params }) => {
    const { queryClient } = context
    const { company } = await queryClient.ensureQueryData(companyQuery(params.companyId))
    if (company.nickname === null) return
    await readOrNotFound(
      Promise.all([
        queryClient.ensureQueryData(accountsQuery(params.companyId)),
        queryClient.ensureQueryData(providersQuery),
        queryClient.ensureQueryData(membersQuery(params.companyId, undefined)),
      ]),
    )
  },
  component: Setup,
})
