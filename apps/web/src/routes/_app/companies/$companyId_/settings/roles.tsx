import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, getRouteApi, notFound, useRouter } from '@tanstack/react-router'
import { ShieldCheckIcon } from 'lucide-react'
import { z } from 'zod'
import { ConnectorLogo, connectionsQuery } from '../../../../../hub/connectors/public.ts'
import { companyQuery, Roles, rolesQuery } from '../../../../../hub/identity/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'
import { ReadFailure } from '../../../../../ui/states.tsx'

const Search = z.object({
  role: z.string().min(1).max(40).optional().catch(undefined),
  new: z.literal(true).optional().catch(undefined),
})

export const Route = createFileRoute('/_app/companies/$companyId_/settings/roles')({
  staticData: {
    section: {
      group: 'company',
      label: 'Papéis',
      icon: ShieldCheckIcon,
      summary: 'O que cada papel usa de cada conector.',
      order: 25,
      keywords: ['permissão', 'acesso', 'conector', 'membro', 'administrador'],
      needs: 'manageRoles',
    },
  },
  validateSearch: Search,
  loader: async ({ context, params }) => {
    const { queryClient } = context
    const { may } = await readOrNotFound(
      queryClient.ensureQueryData(companyQuery(params.companyId)),
    )
    if (!may.manageRoles) throw notFound()
    await readOrNotFound(
      Promise.all([
        queryClient.ensureQueryData(rolesQuery(params.companyId)),
        queryClient.ensureQueryData(connectionsQuery(params.companyId)),
      ]),
    )
  },
  errorComponent: RolesFailure,
  component: RolesPage,
})

/** The roles could not be read: the page's own sentence and a way to read again. */
function RolesFailure({ reset }: { reset: () => void }) {
  const router = useRouter()
  return (
    <ReadFailure
      text="Não deu para carregar os papéis."
      onRetry={() => void router.invalidate().then(reset)}
    />
  )
}

const route = getRouteApi('/_app/companies/$companyId_/settings/roles')

/** The catalog and its logos come from Integrações here, so Identity never imports the connectors. */
function RolesPage() {
  const { companyId } = route.useParams()
  const { data } = useSuspenseQuery(connectionsQuery(companyId))
  return <Roles kit={data.connectors} logo={(entry) => <ConnectorLogo small entry={entry} />} />
}
