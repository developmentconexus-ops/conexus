import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { SignOutButton } from '../../../../../hub/identity/public.ts'
import { buttonVariants } from '../../../../../ui/button.tsx'
import { WelcomeFrame } from '../../../../../ui/welcome-frame.tsx'

/** Step 4: until step 13 brings the composer here, only the way to Início. */
function Step() {
  const params = Route.useParams()
  return (
    <WelcomeFrame
      step={4}
      title="O que vamos construir primeiro?"
      back={{ to: '/companies/$companyId/welcome/team', params }}
      exit={<SignOutButton label="Sair" />}
    >
      <div>
        <Link
          to="/companies/$companyId"
          params={params}
          className={buttonVariants({ variant: 'primary' })}
        >
          Ir para o início
        </Link>
      </div>
    </WelcomeFrame>
  )
}

export const Route = createFileRoute('/_app/companies/$companyId_/welcome/build')({
  staticData: { place: 'O que vamos construir primeiro?' },
  beforeLoad: ({ context, params }) => {
    if (context.company.nickname === null) {
      throw redirect({ to: '/companies/$companyId/welcome/company', params, replace: true })
    }
  },
  component: Step,
})
