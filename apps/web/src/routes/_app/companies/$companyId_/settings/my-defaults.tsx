import { createFileRoute } from '@tanstack/react-router'
import { SlidersHorizontalIcon } from 'lucide-react'
import {
  accountsQuery,
  MyDefaults,
  providersQuery,
} from '../../../../../builder/model-accounts/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/my-defaults')({
  staticData: {
    section: {
      group: 'you',
      label: 'Meus padrões',
      icon: SlidersHorizontalIcon,
      summary: 'O modelo e o raciocínio com que as suas conversas novas começam.',
      order: 25,
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
  component: MyDefaults,
})
