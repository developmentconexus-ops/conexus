import { createFileRoute } from '@tanstack/react-router'
import {
  accountsQuery,
  MyAccounts,
  providersQuery,
} from '../../../../../builder/model-accounts/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/my-model-accounts')({
  staticData: {
    place: 'Minhas contas de modelo',
    section: {
      group: 'you',
      label: 'Minhas contas de modelo',
      order: 20,
      keywords: ['modelo', 'chave', 'assinatura', 'claude', 'google'],
    },
  },
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
