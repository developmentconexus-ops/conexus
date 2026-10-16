import { InvitationId } from '@conexus/hub-api'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { InvitationEntry, InvitationNotFound, sessionQuery } from '../../../hub/identity/public.ts'
import { idOrNotFound } from '../../../platform/hub.ts'

export const Route = createFileRoute('/_public/invitations/$invitationId')({
  params: {
    parse: (raw) => ({ invitationId: idOrNotFound(InvitationId, raw.invitationId) }),
    stringify: (params) => params,
  },
  // Someone who is signed in has no use for the entry page: the acceptance is theirs to read (web W15).
  beforeLoad: async ({ context, params }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (session.state === 'SIGNED_IN') {
      throw redirect({ to: '/invitations/$invitationId/acceptance', params })
    }
  },
  component: InvitationEntry,
  notFoundComponent: InvitationNotFound,
})
