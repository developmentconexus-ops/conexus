import { createFileRoute } from '@tanstack/react-router'
import {
  accountsQuery,
  MyAccounts,
  providersQuery,
} from '../../../../builder/model-accounts/public.ts'
import { readOrNotFound } from '../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/companies/$companyId/model-account')({
  staticData: { place: 'Minha conta de modelo' },
  loader: async ({ context, params }) => {
    const { queryClient } = context
    await readOrNotFound(
      Promise.all([
        queryClient.ensureQueryData(accountsQuery(params.companyId)),
        queryClient.ensureQueryData(providersQuery),
      ]),
    )
  },
  component: MyAccounts,
})
