import { createFileRoute, redirect } from '@tanstack/react-router'
import { accountsQuery } from '../../../../../builder/model-accounts/public.ts'
import {
  everyMemberQuery,
  invitationsQuery,
  preparationOf,
} from '../../../../../hub/identity/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

// The first entry opens on the step still missing; with every step done, the last.
export const Route = createFileRoute('/_app/companies/$companyId_/welcome/')({
  beforeLoad: async ({ context, params }) => {
    const { queryClient, company } = context
    if (company.nickname === null) {
      throw redirect({ to: '/companies/$companyId/welcome/company', params, replace: true })
    }
    const [accounts, members, invitations] = await readOrNotFound(
      Promise.all([
        queryClient.ensureQueryData(accountsQuery(params.companyId)),
        queryClient.ensureQueryData(everyMemberQuery(params.companyId)),
        queryClient.ensureQueryData(invitationsQuery(params.companyId, undefined)),
      ]),
    )
    const done = preparationOf({
      nickname: company.nickname,
      companyAccounts: accounts.company.length,
      others: members.length - 1,
      pending: invitations.invitations.filter((row) => row.state === 'PENDING').length,
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
