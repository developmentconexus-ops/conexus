import { createFileRoute } from '@tanstack/react-router'
import { KeyRoundIcon } from 'lucide-react'
import {
  accountsQuery,
  MyAccounts,
  providersQuery,
} from '../../../../../builder/model-accounts/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/my-model-accounts')({
  staticData: {
    section: {
      group: 'you',
      label: 'Minhas contas de modelo',
      icon: KeyRoundIcon,
      summary: 'As contas de modelo que são só suas, usadas antes das da empresa.',
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
