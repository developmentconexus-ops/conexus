import { InvitationId } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import {
  InvitationEntry,
  InvitationNotFound,
  receivedInvitationQuery,
} from '../../../hub/identity/public.ts'
import { idOrNotFound, readOrNotFound } from '../../../platform/hub.ts'

export const Route = createFileRoute('/_public/invitations/$invitationId')({
  params: {
    parse: (raw) => ({ invitationId: idOrNotFound(InvitationId, raw.invitationId) }),
    stringify: (params) => params,
  },
  loader: ({ context, params }) =>
    readOrNotFound(context.queryClient.fetchQuery(receivedInvitationQuery(params.invitationId))),
  component: InvitationEntry,
  notFoundComponent: InvitationNotFound,
})
