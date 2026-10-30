import { ConnectionId } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import {
  ConnectionPage,
  ConnectionReadFailure,
  connectionQuery,
  connectionsQuery,
} from '../../../../hub/connectors/public.ts'
import { idOrNotFound, readOrNotFound } from '../../../../platform/hub.ts'

// `testar` is how "Ligar e testar" hands the new connection to its page; the page clears it.
const Search = z.object({ testar: z.literal(true).optional().catch(undefined) })

export const Route = createFileRoute('/_app/companies/$companyId/integrations/$connectionId')({
  staticData: { place: 'Integrações' },
  params: {
    parse: (raw) => ({ connectionId: idOrNotFound(ConnectionId, raw.connectionId) }),
    stringify: (p) => p,
  },
  validateSearch: Search,
  loader: ({ context, params }) =>
    readOrNotFound(
      Promise.all([
        context.queryClient.ensureQueryData(connectionsQuery(params.companyId)),
        context.queryClient.ensureQueryData(connectionQuery(params.companyId, params.connectionId)),
      ]),
    ),
  errorComponent: ConnectionReadFailure,
  component: ConnectionPage,
})
