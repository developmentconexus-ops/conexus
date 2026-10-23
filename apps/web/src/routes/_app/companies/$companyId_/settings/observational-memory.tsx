import { createFileRoute } from '@tanstack/react-router'
import { accountsQuery } from '../../../../../builder/model-accounts/public.ts'
import {
  ObservationalMemorySettings,
  observationalMemoryModelsQuery,
} from '../../../../../builder/observational-memory/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/observational-memory')({
  staticData: {
    section: {
      group: 'company',
      label: 'Memória observacional',
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
