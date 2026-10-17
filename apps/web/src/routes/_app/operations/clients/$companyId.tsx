import { CompanyId } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Client, clientQuery, operatorOnly } from '../../../../hub/operations/public.ts'
import { idOrNotFound, readOrNotFound } from '../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/operations/clients/$companyId')({
  beforeLoad: operatorOnly,
  staticData: { place: 'Cliente' },
  // Set by the registration when the provider refused the administrator's address.
  validateSearch: z.object({ convite: z.literal('recusado').optional() }).catch({}),
  params: {
    parse: (raw) => ({ companyId: idOrNotFound(CompanyId, raw.companyId) }),
    stringify: (p) => p,
  },
  loader: ({ context, params }) =>
    readOrNotFound(context.queryClient.ensureQueryData(clientQuery(params.companyId))),
  component: Client,
})
