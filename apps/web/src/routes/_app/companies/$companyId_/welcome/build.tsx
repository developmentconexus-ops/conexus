import { createFileRoute, Link } from '@tanstack/react-router'
import { buttonVariants } from '../../../../../ui/button.tsx'

/** Step 4: until step 13 brings the composer here, only the way to Início. */
function Step() {
  const params = Route.useParams()
  return (
    <div>
      <Link
        to="/companies/$companyId"
        params={params}
        className={buttonVariants({ variant: 'primary' })}
      >
        Ir para o início
      </Link>
    </div>
  )
}

export const Route = createFileRoute('/_app/companies/$companyId_/welcome/build')({
  staticData: { place: 'O que vamos construir primeiro?', step: 4 },
  component: Step,
})
