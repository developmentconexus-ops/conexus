import { InvitationId } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { InvitationAcceptance, receivedInvitationQuery } from '../../../../hub/identity/public.ts'
import { idOrNotFound } from '../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/invitations/$invitationId/acceptance')({
  staticData: { place: 'Convite' },
  params: {
    parse: (raw) => ({ invitationId: idOrNotFound(InvitationId, raw.invitationId) }),
    stringify: (params) => params,
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(receivedInvitationQuery(params.invitationId)),
  component: InvitationAcceptance,
})
