import { createFileRoute } from '@tanstack/react-router'
import { BrainIcon } from 'lucide-react'
import {
  ObservationalMemorySettings,
  observationalMemoryModelsQuery,
} from '../../../../../harness/memory/public.ts'
import { accountsQuery } from '../../../../../harness/model-accounts/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/observational-memory')({
  staticData: {
    section: {
      group: 'company',
      label: 'Memória observacional',
      icon: BrainIcon,
      summary: 'Os modelos que observam as conversas e guardam o que importa.',
      order: 40,
      keywords: ['observador', 'refletor', 'modelo'],
    },
  },
  loader: async ({ context, params }) => {
    const { queryClient } = context
    await readOrNotFound(
      Promise.all([
        queryClient.ensureQueryData(observationalMemoryModelsQuery(params.companyId)),
        queryClient.ensureQueryData(accountsQuery(params.companyId)),
      ]),
    )
  },
  component: ObservationalMemorySettings,
})
