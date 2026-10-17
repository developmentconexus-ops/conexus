import { CompanyId, InvitationId } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Client, clientQuery, operatorOnly } from '../../../../hub/operations/public.ts'
import { idOrNotFound, readOrNotFound } from '../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/operations/clients/$companyId')({
  beforeLoad: operatorOnly,
  staticData: { place: 'Cliente' },
  // The owner invitation whose address the provider refused at registration.
  validateSearch: z.object({ convite: InvitationId.optional() }).catch({}),
  params: {
    parse: (raw) => ({ companyId: idOrNotFound(CompanyId, raw.companyId) }),
    stringify: (p) => p,
  },
  loader: ({ context, params }) =>
    readOrNotFound(context.queryClient.ensureQueryData(clientQuery(params.companyId))),
  component: Client,
})
