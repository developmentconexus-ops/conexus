import { listClients } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Clients, clientsQuery, operatorOnly } from '../../../../hub/operations/public.ts'
import { readOrNotFound } from '../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/operations/clients/')({
  beforeLoad: operatorOnly,
  staticData: { place: 'Central de Operação' },
  validateSearch: listClients.input.query
    .extend({ notice: z.enum(['deleted', 'gone']).optional().catch(undefined) })
    .catch({}),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) =>
    readOrNotFound(context.queryClient.ensureQueryData(clientsQuery(deps.page))),
  component: Clients,
})
