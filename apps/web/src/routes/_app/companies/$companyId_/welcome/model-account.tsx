import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  accountsQuery,
  LinkAccount,
  providersQuery,
} from '../../../../../builder/model-accounts/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'
import { buttonVariants } from '../../../../../ui/button.tsx'

/** Step 2: a model account for the company, in step 11's three ways, or "Fazer depois". */
function Step() {
  const { companyId } = Route.useParams()
  const accounts = useQuery(accountsQuery(companyId))
  const providers = useQuery(providersQuery)
  const linked = (accounts.data?.company.length ?? 0) > 0
  return (
    <>
      <p className="text-text-2">
        O Builder usa a conta da empresa para trabalhar. Ela fica em Configurações, Contas de
        modelo.
      </p>
      {accounts.data && providers.data && (
        <LinkAccount
          companyId={companyId}
          owner="company"
          hasAccounts={linked}
          providers={providers.data.providers}
          kinds={accounts.data.kinds}
        />
      )}
      <div className="flex justify-end">
        <Link
          to="/companies/$companyId/welcome/team"
          params={{ companyId }}
          className={buttonVariants({ variant: linked ? 'default' : 'ghost' })}
        >
          {linked ? 'Continuar' : 'Fazer depois'}
        </Link>
      </div>
    </>
  )
}

export const Route = createFileRoute('/_app/companies/$companyId_/welcome/model-account')({
  staticData: { place: 'Ligue uma conta de modelo', step: 2 },
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
