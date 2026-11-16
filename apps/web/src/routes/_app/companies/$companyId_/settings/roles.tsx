import type { CopyReaders, CopySummary } from '@conexus/hub-api'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, getRouteApi, notFound, useRouter } from '@tanstack/react-router'
import { ShieldCheckIcon } from 'lucide-react'
import { z } from 'zod'
import { ConnectorLogo, connectionsQuery } from '../../../../../hub/connectors/public.ts'
import { copiesQuery, copyReadersQuery, sendRoleCopies } from '../../../../../hub/copies/public.ts'
import type { RoleTables } from '../../../../../hub/identity/public.ts'
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
        queryClient.ensureQueryData(copiesQuery(params.companyId)),
        queryClient.ensureQueryData(copyReadersQuery(params.companyId)),
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

/** The copies of each connector with the roles that read them: what each role's box of "Dados copiados" starts from. */
function tablesOf(copies: readonly CopySummary[], readers: readonly CopyReaders[]): RoleTables {
  const tables: Record<string, RoleTables[string][number][]> = {}
  for (const copy of copies) {
    const source = copy.sources[0]
    if (source === undefined) continue
    const connector = source.connection.connector
    const roles = readers.find((one) => one.copyId === copy.id)?.roles ?? []
    tables[connector] = [
      ...(tables[connector] ?? []),
      {
        id: copy.id,
        name: copy.name,
        about: copy.shown.description ?? copy.label,
        readers: roles.map((one) => one.role),
      },
    ]
  }
  return tables
}

/** The catalog and its logos come from Integrações here, and the copies from Dados, so Identity never imports either. */
function RolesPage() {
  const { companyId } = route.useParams()
  const { data } = useSuspenseQuery(connectionsQuery(companyId))
  const copies = useSuspenseQuery(copiesQuery(companyId))
  const readers = useSuspenseQuery(copyReadersQuery(companyId))
  const send = useMutation(sendRoleCopies)
  return (
    <Roles
      kit={data.connectors}
      logo={(entry) => <ConnectorLogo small entry={entry} />}
      tables={tablesOf(copies.data.copies, readers.data.readers)}
      saveTables={async (role, list) => {
        await send.mutateAsync({ params: { companyId, role }, body: { copies: [...list] } })
      }}
    />
  )
}
