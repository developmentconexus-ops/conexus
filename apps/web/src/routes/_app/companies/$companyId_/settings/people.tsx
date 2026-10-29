import { listCompanyAppAccess, listInvitations, listMembers } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { UsersIcon } from 'lucide-react'
import { z } from 'zod'
import {
  companyAppAccessQuery,
  companyQuery,
  invitationsQuery,
  membersQuery,
  People,
} from '../../../../../hub/identity/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

const Search = z.object({
  members: listMembers.input.query.shape.page.catch(undefined),
  invitations: listInvitations.input.query.shape.page.catch(undefined),
  apps: listCompanyAppAccess.input.query.shape.page.catch(undefined),
})

export const Route = createFileRoute('/_app/companies/$companyId_/settings/people')({
  staticData: {
    section: {
      group: 'company',
      label: 'Pessoas e convites',
      icon: UsersIcon,
      summary: 'Quem está na empresa e quem foi convidado.',
      order: 20,
      keywords: ['convite', 'convidar', 'membro', 'administrador', 'equipe'],
    },
  },
  validateSearch: Search,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, params, deps }) => {
    const { queryClient } = context
    const company = await readOrNotFound(
      queryClient.ensureQueryData(companyQuery(params.companyId)),
    )
    await readOrNotFound(
      Promise.all([
        queryClient.ensureQueryData(membersQuery(params.companyId, deps.members)),
        queryClient.ensureQueryData(companyAppAccessQuery(params.companyId, deps.apps)),
        ...(company.mayInviteAs.length > 0
          ? [queryClient.ensureQueryData(invitationsQuery(params.companyId, deps.invitations))]
          : []),
      ]),
    )
  },
  component: People,
})
