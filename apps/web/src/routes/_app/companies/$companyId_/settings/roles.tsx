import { createFileRoute, notFound } from '@tanstack/react-router'
import { ShieldCheckIcon } from 'lucide-react'
import { z } from 'zod'
import { connectionsQuery } from '../../../../../hub/connectors/public.ts'
import { companyQuery, Roles, rolesQuery } from '../../../../../hub/identity/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

const Search = z.object({
  role: z.string().min(1).max(40).optional().catch(undefined),
  novo: z.literal(true).optional().catch(undefined),
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
  component: Roles,
})
