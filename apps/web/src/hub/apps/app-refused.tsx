import { Link } from '@tanstack/react-router'
import { buttonVariants } from '../../ui/button.tsx'
import { PageTitle } from '../../ui/list.tsx'

/**
 * What the Hub shows when it refuses a pass to an app: the same sentence for an app that does not
 * exist and one the person may not open (security S10), outside the Hub's frame.
 */
export function AppRefused() {
  return (
    <section className="flex w-full flex-col items-center gap-lg text-center">
      <PageTitle>Este app não existe ou você não tem acesso a ele.</PageTitle>
      <Link to="/" className={buttonVariants()}>
        Ir para o Início
      </Link>
    </section>
  )
}
