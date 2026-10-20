import { listClients } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Clients, clientsQuery } from '../../../../hub/operations/public.ts'
import { readOrNotFound } from '../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/operations/clients/')({
  staticData: { place: 'Clientes' },
  validateSearch: listClients.input.query
    .extend({ notice: z.enum(['deleted', 'gone', 'unconfirmed']).optional().catch(undefined) })
    .catch({}),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) =>
    readOrNotFound(context.queryClient.ensureQueryData(clientsQuery(deps.page))),
  component: Clients,
})
