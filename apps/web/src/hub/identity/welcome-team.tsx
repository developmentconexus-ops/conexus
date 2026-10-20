import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { buttonVariants } from '../../ui/button.tsx'
import { InviteForm } from './invite-form.tsx'
import { useTeam } from './preparation-card.tsx'
import { companyQuery } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId_/welcome/team')

/**
 * Step 3, "Convide sua equipe": the invitation form with step 4's refusals; "Fazer depois" moves on,
 * and once an invitation is out the step says "Continuar" instead.
 */
export function WelcomeTeam() {
  const { companyId } = route.useParams()
  const { mayInviteAs } = useSuspenseQuery(companyQuery(companyId)).data
  const team = useTeam(companyId)
  const invited = team !== undefined && team.others + team.pending > 0
  return (
    <div className="flex flex-col gap-lg">
      <InviteForm companyId={companyId} roles={mayInviteAs} />
      <div className="flex justify-end">
        <Link
          to="/companies/$companyId/welcome/build"
          params={{ companyId }}
          className={buttonVariants({ variant: invited ? 'primary' : 'ghost' })}
        >
          {invited ? 'Continuar' : 'Fazer depois'}
        </Link>
      </div>
    </div>
  )
}
