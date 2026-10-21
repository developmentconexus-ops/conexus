import { createFileRoute } from '@tanstack/react-router'
import {
  everyMemberQuery,
  invitationsQuery,
  WelcomeTeam,
} from '../../../../../hub/identity/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

export const Route = createFileRoute('/_app/companies/$companyId_/welcome/team')({
  staticData: { place: 'Convide sua equipe', step: 3 },
  loader: async ({ context, params }) => {
    const { queryClient } = context
    await readOrNotFound(
      Promise.all([
        queryClient.ensureQueryData(everyMemberQuery(params.companyId)),
        queryClient.ensureQueryData(invitationsQuery(params.companyId, undefined)),
      ]),
    )
  },
  component: WelcomeTeam,
})
