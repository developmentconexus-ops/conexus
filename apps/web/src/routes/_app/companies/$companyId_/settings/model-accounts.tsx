import { createFileRoute } from '@tanstack/react-router'
import { KeyRoundIcon } from 'lucide-react'
import {
  accountsQuery,
  ModelAccounts,
  providersQuery,
} from '../../../../../builder/model-accounts/public.ts'
import { everyMemberQuery } from '../../../../../hub/identity/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'
import { RouteReadFailure } from '../../../../../ui/states.tsx'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/model-accounts')({
  staticData: {
    section: {
      group: 'you',
      label: 'Contas de modelo',
      icon: KeyRoundIcon,
      summary: 'As contas que o Builder usa, na ordem em que tenta cada uma.',
      order: 20,
      keywords: ['modelo', 'chave', 'assinatura', 'claude', 'google', 'troca automática'],
    },
  },
  loader: async ({ context, params }) => {
    const { queryClient } = context
    await readOrNotFound(
      Promise.all([
        queryClient.ensureQueryData(accountsQuery(params.companyId)),
        queryClient.ensureQueryData(providersQuery),
        queryClient.ensureQueryData(everyMemberQuery(params.companyId)),
      ]),
    )
  },
  errorComponent: RouteReadFailure,
  component: ModelAccounts,
})
