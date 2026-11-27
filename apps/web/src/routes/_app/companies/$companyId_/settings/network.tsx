import { createFileRoute } from '@tanstack/react-router'
import { GlobeIcon } from 'lucide-react'
import {
  NetworkPending,
  NetworkReadFailure,
  NetworkSettings,
  networkDomainsQuery,
  openAllNetworkQuery,
} from '../../../../../harness/network/public.ts'
import { companyQuery } from '../../../../../hub/identity/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/network')({
  staticData: {
    section: {
      group: 'company',
      label: 'Internet',
      icon: GlobeIcon,
      summary: 'Os sites que as máquinas dos agentes alcançam.',
      order: 47,
      keywords: ['internet', 'domínio', 'rede', 'site'],
    },
  },
  loader: async ({ context, params }) => {
    const { queryClient } = context
    await readOrNotFound(
      Promise.all([
        queryClient.ensureQueryData(companyQuery(params.companyId)),
        queryClient.ensureQueryData(networkDomainsQuery(params.companyId)),
        queryClient.ensureQueryData(openAllNetworkQuery(params.companyId)),
      ]),
    )
  },
  pendingComponent: NetworkPending,
  errorComponent: NetworkReadFailure,
  component: NetworkSettings,
})
