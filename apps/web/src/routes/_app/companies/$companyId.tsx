import { CompanyId, listMembers } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import {
  companyQuery,
  invitationsQuery,
  membersQuery,
  People,
} from '../../../hub/identity/public.ts'
import { idOrNotFound } from '../../../platform/hub.ts'

const Page = listMembers.input.query.shape.page.catch(undefined)
const Search = z.object({ members: Page, invitations: Page })

export const Route = createFileRoute('/_app/companies/$companyId')({
  staticData: { place: 'Empresa' },
  params: {
    parse: (raw) => ({ companyId: idOrNotFound(CompanyId, raw.companyId) }),
    stringify: (p) => p,
  },
  validateSearch: Search,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, params, deps }) => {
    const { queryClient } = context
    const company = await queryClient.ensureQueryData(companyQuery(params.companyId))
    await Promise.all([
      queryClient.ensureQueryData(membersQuery(params.companyId, deps.members)),
      ...(company.mayInviteAs.length > 0
        ? [queryClient.ensureQueryData(invitationsQuery(params.companyId, deps.invitations))]
        : []),
    ])
  },
  component: People,
})
