import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  everyMemberQuery,
  invitationsQuery,
  SignOutButton,
  WelcomeTeam,
} from '../../../../../hub/identity/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'
import { WelcomeFrame } from '../../../../../ui/welcome-frame.tsx'

function Step() {
  const params = Route.useParams()
  return (
    <WelcomeFrame
      step={3}
      title="Convide sua equipe"
      back={{ to: '/companies/$companyId/welcome/model-account', params }}
      exit={<SignOutButton label="Sair" />}
    >
      <WelcomeTeam />
    </WelcomeFrame>
  )
}

export const Route = createFileRoute('/_app/companies/$companyId_/welcome/team')({
  staticData: { place: 'Convide sua equipe' },
  beforeLoad: ({ context, params }) => {
    if (context.company.nickname === null) {
      throw redirect({ to: '/companies/$companyId/welcome/company', params, replace: true })
    }
  },
  loader: async ({ context, params }) => {
    const { queryClient } = context
    await readOrNotFound(
      Promise.all([
        queryClient.ensureQueryData(everyMemberQuery(params.companyId)),
        queryClient.ensureQueryData(invitationsQuery(params.companyId, undefined)),
      ]),
    )
  },
  component: Step,
})
