import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import {
  accountsQuery,
  LinkAccount,
  providersQuery,
} from '../../../../../builder/model-accounts/public.ts'
import { SignOutButton } from '../../../../../hub/identity/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'
import { buttonVariants } from '../../../../../ui/button.tsx'
import { WelcomeFrame } from '../../../../../ui/welcome-frame.tsx'

/** Step 2: a model account for the company, in step 11's three ways, or "Fazer depois". */
function Step() {
  const { companyId } = Route.useParams()
  const accounts = useQuery(accountsQuery(companyId))
  const providers = useQuery(providersQuery)
  const linked = (accounts.data?.company.length ?? 0) > 0
  return (
    <WelcomeFrame step={2} title="Ligue uma conta de modelo" exit={<SignOutButton label="Sair" />}>
      <p className="text-text-2">
        O Builder usa a conta da empresa para trabalhar. Ela fica em Configurações, Contas de
        modelo.
      </p>
      {accounts.data && providers.data && (
        <LinkAccount
          companyId={companyId}
          owner="company"
          providers={providers.data.providers}
          kinds={accounts.data.kinds}
        />
      )}
      <div className="flex justify-end">
        <Link
          to="/companies/$companyId/welcome/team"
          params={{ companyId }}
          className={buttonVariants({ variant: linked ? 'primary' : 'ghost' })}
        >
          {linked ? 'Continuar' : 'Fazer depois'}
        </Link>
      </div>
    </WelcomeFrame>
  )
}

export const Route = createFileRoute('/_app/companies/$companyId_/welcome/model-account')({
  staticData: { place: 'Ligue uma conta de modelo' },
  beforeLoad: ({ context, params }) => {
    if (context.company.nickname === null) {
      throw redirect({ to: '/companies/$companyId/welcome/company', params, replace: true })
    }
  },
  loader: async ({ context, params }) => {
    const { queryClient } = context
    await readOrNotFound(
      Promise.all([
        queryClient.ensureQueryData(accountsQuery(params.companyId)),
        queryClient.ensureQueryData(providersQuery),
      ]),
    )
  },
  component: Step,
})
