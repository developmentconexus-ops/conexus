import { createFileRoute, Link } from '@tanstack/react-router'
import { readStart, Start } from '../../../../../builder/conversation/public.ts'

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
  loader: ({ context, params }) => readStart(context.queryClient, params.companyId),
  component: Step,
})
