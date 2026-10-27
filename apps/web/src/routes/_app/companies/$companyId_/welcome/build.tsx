import { createFileRoute, Link } from '@tanstack/react-router'
import { Start } from '../../../../../builder/conversation/public.ts'
import { accountsQuery } from '../../../../../builder/model-accounts/public.ts'
import { projectsQuery } from '../../../../../hub/projects/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

/** Step 4: Início's box, and the way to Início without asking for anything. */
function Step() {
  const params = Route.useParams()
  return (
    <div className="flex flex-col gap-lg">
      <Start companyId={params.companyId} />
      <Link
        to="/companies/$companyId"
        params={params}
        className="self-center text-label text-text-2 underline hover:text-text"
      >
        Ir para o início sem pedir nada
      </Link>
    </div>
  )
}

export const Route = createFileRoute('/_app/companies/$companyId_/welcome/build')({
  staticData: { place: 'O que vamos construir primeiro?', step: 4 },
  loader: ({ context, params }) =>
    readOrNotFound(
      Promise.all([
        context.queryClient.ensureQueryData(projectsQuery(params.companyId, undefined)),
        context.queryClient.ensureQueryData(accountsQuery(params.companyId)),
      ]),
    ),
  component: Step,
})
