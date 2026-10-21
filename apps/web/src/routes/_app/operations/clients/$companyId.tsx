import { CompanyId, InvitationId, listInvitations, listMembers } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AccountKinds, kindsQuery } from '../../../../builder/model-accounts/public.ts'
import { invitationsQuery, membersQuery } from '../../../../hub/identity/public.ts'
import { Client, clientQuery } from '../../../../hub/operations/public.ts'
import { idOrNotFound, readOrNotFound } from '../../../../platform/hub.ts'

function ClientWithKinds() {
  return <Client kinds={<AccountKinds />} />
}

export const Route = createFileRoute('/_app/operations/clients/$companyId')({
  staticData: { place: 'Cliente' },
  // The owner invitation whose address the provider refused at registration.
  validateSearch: z.object({
    convite: InvitationId.optional().catch(undefined),
    members: listMembers.input.query.shape.page.catch(undefined),
    invitations: listInvitations.input.query.shape.page.catch(undefined),
  }),
  loaderDeps: ({ search }) => ({ members: search.members, invitations: search.invitations }),
  params: {
    parse: (raw) => ({ companyId: idOrNotFound(CompanyId, raw.companyId) }),
    stringify: (p) => p,
  },
  loader: async ({ context, params, deps }) => {
    const { queryClient } = context
    const { client } = await readOrNotFound(
      queryClient.ensureQueryData(clientQuery(params.companyId)),
    )
    if (client.state.kind !== 'ACTIVE') return
    await readOrNotFound(
      Promise.all([
        queryClient.ensureQueryData(kindsQuery(params.companyId)),
        queryClient.ensureQueryData(membersQuery(params.companyId, deps.members)),
        queryClient.ensureQueryData(invitationsQuery(params.companyId, deps.invitations)),
      ]),
    )
  },
  component: ClientWithKinds,
})
