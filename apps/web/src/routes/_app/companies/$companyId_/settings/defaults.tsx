import { createFileRoute } from '@tanstack/react-router'
import {
  accountsQuery,
  CompanyDefaults,
  providersQuery,
} from '../../../../../builder/model-accounts/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/defaults')({
  staticData: {
    section: {
      group: 'company',
      label: 'Padrões da empresa',
      order: 35,
      keywords: ['raciocínio', 'modelo padrão', 'modelo', 'conversa nova'],
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
  component: CompanyDefaults,
})
