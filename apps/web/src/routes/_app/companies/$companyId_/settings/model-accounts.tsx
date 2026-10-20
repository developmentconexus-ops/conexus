import { createFileRoute } from '@tanstack/react-router'
import {
  accountsQuery,
  CompanyAccounts,
  providersQuery,
} from '../../../../../builder/model-accounts/public.ts'
import { everyMemberQuery } from '../../../../../hub/identity/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/model-accounts')({
  staticData: {
    section: {
      group: 'company',
      label: 'Contas de modelo',
      order: 30,
      keywords: ['modelo padrão', 'troca automática', 'chave', 'assinatura'],
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
  component: CompanyAccounts,
})
