import { CompanyId } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { Client, clientQuery, operatorOnly } from '../../../../hub/operations/public.ts'
import { idOrNotFound, readOrNotFound } from '../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/operations/clients/$companyId')({
  beforeLoad: operatorOnly,
  staticData: { place: 'Cliente' },
  params: {
    parse: (raw) => ({ companyId: idOrNotFound(CompanyId, raw.companyId) }),
    stringify: (p) => p,
  },
  loader: ({ context, params }) =>
    readOrNotFound(context.queryClient.ensureQueryData(clientQuery(params.companyId))),
  component: Client,
})
