import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { buttonVariants } from '../../ui/button.tsx'
import { InviteForm } from './invite-form.tsx'
import { useTeamDone } from './preparation-card.tsx'
import { companyQuery } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId_/welcome/team')

/**
 * Step 3, "Convide sua equipe": the invitation form with step 4's refusals; "Fazer depois" moves on,
 * and once the company has a team the step says "Continuar" instead, beside the form's own primary
 * button.
 */
export function WelcomeTeam() {
  const { companyId } = route.useParams()
  const { mayInviteAs } = useSuspenseQuery(companyQuery(companyId)).data
  const invited = useTeamDone(companyId) === true
  return (
    <div className="flex flex-col gap-lg">
      <InviteForm companyId={companyId} roles={mayInviteAs} />
      <div className="flex justify-end">
        <Link
          to="/companies/$companyId/welcome/build"
          params={{ companyId }}
          className={buttonVariants({ variant: invited ? 'default' : 'ghost' })}
        >
          {invited ? 'Continuar' : 'Fazer depois'}
        </Link>
      </div>
    </div>
  )
}
