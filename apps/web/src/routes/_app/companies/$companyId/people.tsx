import { listInvitations, listMembers } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import {
  companyQuery,
  invitationsQuery,
  membersQuery,
  People,
} from '../../../../hub/identity/public.ts'
import { readOrNotFound } from '../../../../platform/hub.ts'

const Search = z.object({
  members: listMembers.input.query.shape.page.catch(undefined),
  invitations: listInvitations.input.query.shape.page.catch(undefined),
})

export const Route = createFileRoute('/_app/companies/$companyId/people')({
  staticData: { place: 'Pessoas' },
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
        ...(company.mayInviteAs.length > 0
          ? [queryClient.ensureQueryData(invitationsQuery(params.companyId, deps.invitations))]
          : []),
      ]),
    )
  },
  component: People,
})
