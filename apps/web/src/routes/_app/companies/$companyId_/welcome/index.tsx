import { createFileRoute, redirect } from '@tanstack/react-router'
import { accountsQuery } from '../../../../../builder/model-accounts/public.ts'
import {
  everyMemberQuery,
  invitationsQuery,
  preparationOf,
} from '../../../../../hub/identity/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

// The first entry opens on the step still missing; with every step done, the last. The steps'
// frame already sent a company without its nickname to step 1.
export const Route = createFileRoute('/_app/companies/$companyId_/welcome/')({
  beforeLoad: async ({ context, params }) => {
    const { queryClient } = context
    const [accounts, members, invitations] = await readOrNotFound(
      Promise.all([
        queryClient.ensureQueryData(accountsQuery(params.companyId)),
        queryClient.ensureQueryData(everyMemberQuery(params.companyId)),
        queryClient.ensureQueryData(invitationsQuery(params.companyId, undefined)),
      ]),
    )
    const done = preparationOf({
      companyAccounts: accounts.company.length,
      members,
      invitations: invitations.invitations,
    })
    if (!done.modelAccount) {
      throw redirect({ to: '/companies/$companyId/welcome/model-account', params, replace: true })
    }
    if (!done.team) {
      throw redirect({ to: '/companies/$companyId/welcome/team', params, replace: true })
    }
    throw redirect({ to: '/companies/$companyId/welcome/build', params, replace: true })
  },
})
