import type { AgentId, ConnectionId } from '@conexus/hub-api'
import { listDataReads } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, getRouteApi, notFound, useRouter } from '@tanstack/react-router'
import { ScrollTextIcon } from 'lucide-react'
import { z } from 'zod'
import { agentsQuery } from '../../../../../builder/agents/public.ts'
import { connectionsQuery } from '../../../../../hub/connectors/public.ts'
import {
  DATA_READS_TEXT,
  DataReads,
  DataReadsPending,
  dataReadsQuery,
} from '../../../../../hub/data/public.ts'
import { companyQuery, everyMemberQuery } from '../../../../../hub/identity/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'
import { ReadFailure } from '../../../../../ui/states.tsx'

const filters = listDataReads.input.query.shape

const Search = z.object({
  person: filters.person.catch(undefined),
  agent: filters.agent.catch(undefined),
  table: filters.table.catch(undefined),
  outcome: filters.outcome.catch(undefined),
  page: filters.page.catch(undefined),
  read: z.uuid().optional().catch(undefined),
})

export const Route = createFileRoute('/_app/companies/$companyId_/settings/data-reads')({
  staticData: {
    section: {
      group: 'company',
      label: 'Registro de dados',
      icon: ScrollTextIcon,
      summary: 'Cada leitura que um agente ou um app fez, sem o resultado.',
      order: 27,
      keywords: ['registro', 'leitura', 'auditoria', 'agente', 'consulta', 'exportar'],
      needs: 'readDataReads',
    },
  },
  validateSearch: Search,
  // Opening a read is the same page: only the filters and the page read again.
  loaderDeps: ({ search: { read: _, ...deps } }) => deps,
  loader: async ({ context, params, deps }) => {
    const { queryClient } = context
    const { companyId } = params
    const { may } = await readOrNotFound(queryClient.ensureQueryData(companyQuery(companyId)))
    if (!may.readDataReads) throw notFound()
    const { page, ...shown } = deps
    await readOrNotFound(
      Promise.all([
        queryClient.ensureQueryData(dataReadsQuery(companyId, shown, page)),
        queryClient.ensureQueryData(everyMemberQuery(companyId)),
        queryClient.ensureQueryData(agentsQuery(companyId, undefined)),
        queryClient.ensureQueryData(connectionsQuery(companyId)),
      ]),
    )
  },
  pendingComponent: DataReadsPending,
  errorComponent: DataReadsFailure,
  component: DataReadsPage,
})

/** The Registro could not be read: its own sentence and a way to read again. */
function DataReadsFailure({ reset }: { reset: () => void }) {
  const router = useRouter()
  return (
    <ReadFailure
      text={DATA_READS_TEXT.failed}
      onRetry={() => void router.invalidate().then(reset)}
    />
  )
}

const route = getRouteApi('/_app/companies/$companyId_/settings/data-reads')

/** The people, the saved agents' and the connections' names come from their owners here, so the Registro imports none of them. */
function DataReadsPage() {
  const { companyId } = route.useParams()
  const { person } = route.useRouteContext()
  const members = useSuspenseQuery(everyMemberQuery(companyId)).data
  const { agents } = useSuspenseQuery(agentsQuery(companyId, undefined)).data
  const { connections } = useSuspenseQuery(connectionsQuery(companyId)).data
  const agentNames = new Map<AgentId, string>(agents.map((agent) => [agent.id, agent.name]))
  const connectionNames = new Map<ConnectionId, string>(
    connections.map((connection) => [connection.id, connection.name]),
  )
  return (
    <DataReads
      lists={{
        people: members.map((member) => ({ id: member.personId, name: member.name })),
        tables: [],
        names: {
          agent: (id) => agentNames.get(id),
          connection: (id) => connectionNames.get(id),
        },
        viewer: person.id,
      }}
    />
  )
}
